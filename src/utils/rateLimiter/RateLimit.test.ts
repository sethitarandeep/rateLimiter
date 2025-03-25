import { Request, Response, NextFunction } from 'express';
import { rateLimit } from './RateLimit';
import { redisClient } from '../Redis';


jest.mock('../Redis', () => ({
  redisClient: {
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    zAdd: jest.fn(),
    zRemRangeByScore: jest.fn(),
    zCard: jest.fn(),
    zRange: jest.fn(),
  },
}));

describe('Rate Limiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { ip: '127.0.0.1', query: {}, user: undefined };
    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });
  afterEach(() => jest.clearAllMocks())

  it('should handle Redis errors gracefully', async () => {
    (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

    const limiter = rateLimit({ windowMs: 60000, limit: 5 });
    await limiter(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should allow requests within limit using sliding log', async () => {
    (redisClient.zAdd as jest.Mock).mockResolvedValue(1);
    (redisClient.zRemRangeByScore as jest.Mock).mockResolvedValue(0);
    (redisClient.zCard as jest.Mock).mockResolvedValue(3);
    (redisClient.expire as jest.Mock).mockResolvedValue(true);

    const limiter = rateLimit({ windowMs: 60000, limit: 5 });
    await limiter(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
  });

  it('should block requests exceeding limit using sliding log', async () => {
    (redisClient.zAdd as jest.Mock).mockResolvedValue(1);
    (redisClient.zRemRangeByScore as jest.Mock).mockResolvedValue(0);
    (redisClient.zCard as jest.Mock).mockResolvedValue(6);
    (redisClient.expire as jest.Mock).mockResolvedValue(true);
    (redisClient.zRange as jest.Mock).mockResolvedValue(['160945']);

    const limiter = rateLimit({ windowMs: 60000, limit: 5 });
    await limiter(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too many requests, please try again later',
    }))
  });

  it('should override the limit and succeed', async () => {
    (redisClient.zAdd as jest.Mock).mockResolvedValue(1);
    (redisClient.zRemRangeByScore as jest.Mock).mockResolvedValue(0);
    (redisClient.zCard as jest.Mock).mockResolvedValue(3);
    (redisClient.get as jest.Mock).mockResolvedValue('4');

    const limiter = rateLimit({
      windowMs: 60000,
      limit: 5,
      override: { limit: 4, event: ['special'], windowMs: 60000 },
    });
    mockReq.query = {
      ...mockReq.query,
      event: 'special'
    };
    await limiter(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '1');
  });

  it('should override the limit and fail', async () => {
    (redisClient.zAdd as jest.Mock).mockResolvedValue(1);
    (redisClient.zRemRangeByScore as jest.Mock).mockResolvedValue(0);
    (redisClient.zCard as jest.Mock).mockResolvedValue(3);
    (redisClient.get as jest.Mock).mockResolvedValue('3');

    const limiter = rateLimit({
      windowMs: 60000,
      limit: 5,
      override: { limit: 3, event: ['special'], windowMs: 60000 },
    });
    mockReq.query = {
      ...mockReq.query,
      event: 'special'
    };
    await limiter(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Too many requests, please try again later',
    }))
  });
});
