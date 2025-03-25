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

export const set = async (key: string, value: string, ttl?: number) => {
    if (!redisClient) {
        await connect();
    }
    if (ttl) {
        await redisClient.set(key, value, { EX: ttl });
    } else {
        await redisClient.set(key, value);
    }
}

export const get = async (key: string) => {
    if (!redisClient) {
        await connect();
    }
    return await redisClient.get(key);
}

export const del = async (key: string) => {
    if (!redisClient) {
        await connect();
    }
    await redisClient.del(key);
}

// export default class RedisClient {
//     private static instance: RedisClientType<any, any, any>;

//     private constructor() {}

//     public static async connect() {
//         if (!RedisClient.instance) {
//             RedisClient.instance = await createClient({
//                 url: "redis"
//             }).on("error", (err) => {
//                 console.error("Redis error: ", err);
//             })
//             .connect();
//         }
//         return RedisClient.instance;
//     }   

//     public async set(key: string, value: string, ttl?: number) {
//         if (ttl) {
//             await await RedisClient.instance.set(key, value, { EX: ttl });
//         } else {
//             await RedisClient.instance.set(key, value);
//         }
//     }

//     public async get(key: string) {
//         return await RedisClient.instance.get(key);
//     }

//     public async del(key: string) {
//         await RedisClient.instance.del(key);
//     }
// }
