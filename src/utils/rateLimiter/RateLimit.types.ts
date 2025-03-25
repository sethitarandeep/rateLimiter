type OverrideLimit = {
    limit: number;
    event: string[];
    windowMs: number;
}

type RequestLimit = {
    authenticatedMaxRequests?: number,
    maxRequests: number
}

export type RateLimitOptions = {
    windowMs: number;
    limit: RequestLimit | number;
    message?: string;
    key?: string;
    override?: OverrideLimit;
}

export interface RateLimitInfo {
    limit: number;
    current: number;
    remaining: number;
    resetTime: number;
}
