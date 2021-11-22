const redis = require('redis');

const RedisClient = process.env.REDIS_URL // On Heroku, this is specified by redis add-on
  ? redis.createClient(process.env.REDIS_URL)
  : redis.createClient({
    host: 'redis-server', // Docker compose service hosting redis
    port: 6379, // Default redis port
  });

module.exports = RedisClient;
