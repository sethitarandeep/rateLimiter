import { Router, Request, Response } from "express";
import { rateLimit } from "../utils/rateLimiter/RateLimit";

const router = Router();
const unAuthenticatedLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    override: {
        windowMs: 60 * 1000,
        limit: 10,
        event: ["override"]
    }
});

const authenticatedLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: {
        maxRequests: 5,
        authenticatedMaxRequests: 10
    },
    override: {
        windowMs: 60 * 1000,
        limit: 10,
        event: ["override"]
    },
});


export default class Routes {
    constructor() {
        this.registerRoutes();
    }

    registerRoutes() {

        router.route("/")
            .get((req: Request, res: Response) => {
                res.send("Welcome to rate limiter example");
            });

        router.route("/unauthenticated")
            .get(unAuthenticatedLimiter, (req: Request, res: Response) => {
                res.send("Fixed Rate limiter example");
                return;
            });

        router.route("/authenticated")
            .get(authenticatedLimiter, (req: Request, res: Response) => {
                res.send("Rate limiter example");
            });
    }

    get routes() {
        return router;
    }
}


