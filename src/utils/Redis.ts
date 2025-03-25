import { createClient } from "redis";

type RedisClientType = ReturnType<typeof createClient>;
export let redisClient: RedisClientType;


export const connect =  async () => {
    if (!redisClient) {
        redisClient = await createClient({
            url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
            socket: {
                connectTimeout: 10_000,
            },
        }).on("error", (err) => {
            console.error("Redis error: ", err);
        })
        .on("ready", () => {
            console.log("Redis is connected");
        })
        .connect();
    }
    return redisClient;
}
