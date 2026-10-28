const { Queue } = require('bullmq');

// BullMQ ke liye wapas Upstash connection config
const connection = {
  host: process.env.REDISH_HOST,
  port: 15248,
  password: process.env.REDISH_KEY,
  username: "default",
  maxRetriesPerRequest: null,
};

const submissionQueue = new Queue('code-submission', { 
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    }
});

module.exports = submissionQueue;