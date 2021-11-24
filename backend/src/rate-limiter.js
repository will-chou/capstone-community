const moment = require('moment');
const redisClient = require('./redis-client');

const RATE_LIMIT_WINDOW_HOURS = 3; // Window duration for which rate limiting should apply
const REQUEST_LIMIT_COUNT = 250; // Max number of requests per window
const LOG_GROUP_WINDOW_HOURS = 1; // Rate limit window bucket duration

const shouldRateLimit = (rateLimitKey) => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return new Promise(resolve => {
    redisClient.get(rateLimitKey, (err, val) => {
      if (err) {
        throw new Error('Error fetching from redis');
      }
      const currTime = moment();
      if (!val && REQUEST_LIMIT_COUNT > 0) {
        redisClient.set(
          rateLimitKey,
          JSON.stringify([
            {
              ts: currTime.unix(),
              cnt: 1,
            },
          ]),
          'EX',
          RATE_LIMIT_WINDOW_HOURS * 60 * 60,
        );
        // return false;
        resolve(false);
      }
      const data = JSON.parse(val);
      if (!data) {
        return false;
      }
      const startTime = currTime.subtract(RATE_LIMIT_WINDOW_HOURS, 'h').unix();
      let requestCountInWindow = 0;
      const newData = data.filter((reqGroup) => {
        if (reqGroup.ts > startTime) {
          requestCountInWindow += reqGroup.cnt;
          return true;
        }
        return false;
      });

      if (requestCountInWindow >= REQUEST_LIMIT_COUNT) {
        redisClient.set(
          rateLimitKey,
          JSON.stringify(newData),
          'EX',
          RATE_LIMIT_WINDOW_HOURS * 60 * 60,
        );
        // return true;
        resolve(true);
      }
      const logGroupStartTime = currTime
        .subtract(LOG_GROUP_WINDOW_HOURS, 'h')
        .unix();
      if (
        newData.length > 0
        && newData[newData.length - 1].ts > logGroupStartTime
      ) {
        newData[newData.length - 1].cnt += 1;
      } else {
        newData.push({ ts: currTime.unix(), cnt: 1 });
      }
      redisClient.set(
        rateLimitKey,
        JSON.stringify(newData),
        'EX',
        RATE_LIMIT_WINDOW_HOURS * 60 * 60,
      );
      // return false;
      resolve(false);
    });
  });
};

// Sliding window counter rate limiting middleware based on authenticated user email
const userRateLimiterMiddleware = async (req, res, next) => {
  try {
    if (!req.locals || !req.locals.user.email) {
      throw new Error('Invalid user rate limit');
    }
    var shouldLimit = await shouldRateLimit(req.locals.user.email);
    if (shouldLimit) {
      return res.status(429).send({ error: 'Rate limit exceeded' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

// Sliding window counter rate limiting middleware based on request ip
const ipRateLimiterMiddleware = async (req, res, next) => {
  try {
    var shouldLimit = await shouldRateLimit(req.ip);
    if (shouldLimit) {
      return res.status(429).send({ error: 'Rate limit exceeded' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { ipRateLimiterMiddleware, userRateLimiterMiddleware };
