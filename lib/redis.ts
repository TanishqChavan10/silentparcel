import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 60000,
});

export default redis;

// Redis key patterns
export const REDIS_KEYS = {
  CHAT_ROOM: (roomId: string) => `chat:room:${roomId}`,
  CHAT_USERS: (roomId: string) => `chat:users:${roomId}`,
  CHAT_MESSAGES: (roomId: string) => `chat:messages:${roomId}`,
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
  FILE_UPLOAD: (token: string) => `file_upload:${token}`,
  TEMP_FILES: (fileId: string) => `temp_files:${fileId}`,
};

// Helper functions
export const setWithExpiry = async (key: string, value: string, ttl: number) => {
  await redis.setex(key, ttl, value);
};

export const getAndDelete = async (key: string) => {
  const value = await redis.get(key);
  if (value) {
    await redis.del(key);
  }
  return value;
};
