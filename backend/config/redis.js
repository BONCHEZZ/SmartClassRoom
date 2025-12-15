let client = null;

const connectRedis = async () => {
  try {
    const redis = require('redis');
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    
    await client.connect();
    console.log('Redis Connected');
    return client;
  } catch (error) {
    console.warn('Redis connection failed, continuing without Redis:', error.message);
    return null;
  }
};

const getRedisClient = () => client;

module.exports = { connectRedis, getRedisClient };