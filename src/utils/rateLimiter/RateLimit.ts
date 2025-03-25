import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../Redis'
import { RATE_LIMIT_ERROR, RATE_LIMIT_PREFIX, OVERRIDE_PREFIX } from '../../common/Constant';
import { RateLimitOptions, RateLimitInfo } from './RateLimit.types';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Return a middleware to limit the number of requests per windowMs
 * @param options Rate limit options
 * @returns Middleware function
 */
export const rateLimit = (options: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { windowMs, message = RATE_LIMIT_ERROR.message, key = `${RATE_LIMIT_PREFIX}:ip:${req.ip}` } = options;
          let rateLimitInfo: RateLimitInfo;
          const limit = await checkForOverride(req, options) || await getRequestLimit(req, options);

          rateLimitInfo = await checkSlidingLogLimit(key, limit, windowMs);

          res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit.toString());
          res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
          res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());

          if (rateLimitInfo.remaining <= 0) {
              res.status(RATE_LIMIT_ERROR.httpStatusCode).json({
                  error: message,
                  retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)
              });
              return;
          }

          next();
        } catch (error) {
          console.error('Rate limiter error:', error);
          next();
        }
    }
}


/**
 * Bonus task: Check for override limit if an event is present in request query and matches the event list
 * from the config options. If override limit is applicable, set the limit and expiry in Redis and return the limit.
 * @param req
 * @param options
 * @returns Override limit if applicable
 * @throws Error if Redis operation fails
 */
const checkForOverride = async (req: Request, options: RateLimitOptions) => {
  try {
    if (!options.override) return undefined;

    const { limit, event, windowMs } = options.override;
    const queryEvent = req?.query?.event as string;
    const key = `${OVERRIDE_PREFIX}:${req.ip}`;
    const validOverride = await redisClient.get(key);

    if (validOverride) {
      return Number(validOverride)
    }

    if (queryEvent && event.includes(queryEvent)) {
      await redisClient.set(key, limit, {
        PX: windowMs
      });
      return limit;
    }

    return undefined;
  } catch (error) {
    console.error('Rate limiter error:', error);
    throw new Error('Error checking for override');
  }
}

/**
 * Get the request limit based on the user's authentication status
 * @param req
 * @param options
 * @returns Request limit
 * @throws Error if Redis operation fails
 */
const getRequestLimit = async (req: Request, options: RateLimitOptions) => {
  try {
    if (typeof options.limit !== 'number') {
      const { authenticatedMaxRequests = 0, maxRequests } = options.limit;
      return req.user && authenticatedMaxRequests ? authenticatedMaxRequests : maxRequests;
    }
    return options.limit;
  } catch (error) {
    console.error('Error getRequestLimit:', error);
    throw new Error('Error getting request limit');
  }
}

/**
 * Bonus task: Implement a sliding log rate limiter
 * @param key Rate limiting identifier, defaults to IP address
 * @param limit Maximum number of requests
 * @param windowMs Window size in milliseconds
 * @returns Rate limit info object
 * @throws Error if Redis operation fails
 */
const checkSlidingLogLimit = async (
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitInfo> => {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Add timestamp to the set
    await redisClient.zAdd(key, { score: now, value: `${now}`});
    
    // Purge expired values
    await redisClient.zRemRangeByScore(key, 0, windowStart);
    const count = await redisClient.zCard(key);
    await redisClient.expire(key, windowMs / 1000);
    

    let resetTime = now + windowMs;
    if (count > limit) {     //Limit is inclusive
      const oldestTimestamps = await redisClient.zRange(key, 0, 0);
      if (oldestTimestamps.length > 0) {
        const oldestTime = Number(oldestTimestamps[0]);
        resetTime = windowMs + oldestTime;
      }
    }
    console.log("Returning Limit Info: ", {
      limit,
      current: count,
      remaining: Math.max(0, limit - count),
      resetTime
    });

    return {
      limit,
      current: count,
      remaining: Math.max(0, limit - count),      
      resetTime
    };
  } catch (error) {
    throw new Error('Rate limiter error');
  }
}



