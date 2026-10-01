import { Worker } from 'bullmq';
import crypto from 'crypto';
import Redis from 'ioredis';

const redisConnection = new Redis(
    'rediss://default:gQAAAAAABPVvAAIgcDJlNmNmYTAxN2RlODI0Nzc1OGI3OGM4YWIxMThhYzcwMQ@holy-terrapin-324975.upstash.io:6379',
    { maxRetriesPerRequest: null }
);

// 2. Start the worker
const worker = new Worker('webhook-deliveries', async job => {
    const { url, payload, secret } = job.data;

    console.log(`[Worker] Attempting delivery to ${url} (Attempt ${job.attemptsMade + 1})`);

    const timestamp = Date.now().toString();
    const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(signaturePayload)
        .digest('hex');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Timestamp': timestamp,
                'X-Webhook-Signature': `v1=${signature}`
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        console.log(`[Worker] ✅ Successfully delivered to ${url}`);
        return { deliveredAt: new Date(), status: response.status };

    } catch (error: any) {
        console.error(`[Worker] ❌ Failed to deliver to ${url}: ${error.message}`);
        throw error;
    }
}, {
    // Pass the connection object here
    connection: redisConnection
});

console.log('[Worker] Daemon is running and listening for jobs...');