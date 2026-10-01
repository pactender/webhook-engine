# Fault-Tolerant Webhook Delivery Engine

A production-grade, decoupled webhook processing system built with Node.js, TypeScript, and BullMQ. Designed to reliably deliver asynchronous events to third-party endpoints with cryptographic security and automated failure recovery.

## 🚀 System Architecture
- **Producer (API):** An Express server that immediately accepts incoming events and offloads them to a Redis queue, ensuring sub-millisecond response times (`HTTP 202 Accepted`) regardless of downstream network conditions.
- **Message Broker:** Redis-backed job queues utilizing BullMQ for high-throughput task management.
- **Consumer (Worker Daemon):** An independent Node.js worker thread that processes the queue, executing HTTP deliveries.

## 🛡️ Enterprise-Grade Reliability Features
- **Exponential Backoff & Retries:** Automatically handles downstream API outages by retrying failed deliveries 5 times with increasing delays (1s, 2s, 4s, 8s).
- **HMAC-SHA256 Signatures:** Cryptographically signs every payload with a timestamp and secret key (mirroring Stripe's security model) to prevent replay attacks and ensure data integrity.
- **Fail-Fast Circuit Breaking:** Implements strict `AbortSignal` timeouts to prevent hanging sockets when target servers are unresponsive.

## 💻 Tech Stack
TypeScript • Node.js • Express • BullMQ • Redis (Upstash)