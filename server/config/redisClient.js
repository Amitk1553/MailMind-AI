import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'       
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis successfully!'));

// Connect immediately when this file is imported
await redisClient.connect();

export default redisClient;