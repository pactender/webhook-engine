import express from 'express';
import { Queue } from 'bullmq';
import Redis from 'ioredis'; // 1. Add this import

const app = express();
app.use(express.json());

// 2. Wrap your Upstash URL in new Redis()
const redisConnection = new Redis(
    'rediss://default:gQAAAAAABPVvAAIgcDJlNmNmYTAxN2RlODI0Nzc1OGI3OGM4YWIxMThhYzcwMQ@holy-terrapin-324975.upstash.io:6379',
    { maxRetriesPerRequest: null }
);

const deliveryQueue = new Queue('webhook-deliveries', {
    connection: redisConnection
});

// 2. Create the endpoint that accepts new events
app.post('/api/events', async (req, res) => {
    const { targetUrl, payload, secret } = req.body;

    // Basic validation
    if (!targetUrl || !payload) {
        res.status(400).json({ error: 'targetUrl and payload are required' });
        return;
    }

    // 3. Push the task to the queue instead of processing it right now.
    // This is the secret to a reliable system!
    await deliveryQueue.add('deliver-task', {
        url: targetUrl,
        payload: payload,
        secret: secret || 'default_secret'
    }, {
        attempts: 5, // If delivery fails, try 4 more times
        backoff: {
            type: 'exponential',
            delay: 1000, // Wait 1s, then 2s, 4s, 8s between retries
        }
    });

    console.log(`[API] Event accepted and queued for: ${targetUrl}`);

    // Immediately return a success response to the user
    res.status(202).json({ message: 'Event queued successfully' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[API] Server is running on http://localhost:${PORT}`);
});