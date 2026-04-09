# Evolution API Setup Guide: From Zero to Working WhatsApp Chatbot

This document details every problem encountered, every piece of research done, and every solution applied to get the Evolution API running locally with Docker for a WhatsApp chatbot project. It serves as both a troubleshooting guide and a reference for anyone setting up Evolution API in 2025/2026.

---

## Table of Contents

1. [What is Evolution API](#1-what-is-evolution-api)
2. [Docker Image Confusion: Two Different Providers](#2-docker-image-confusion-two-different-providers)
3. [Problem 1: Database Provider Required](#3-problem-1-database-provider-required)
4. [Problem 2: Redis Required](#4-problem-2-redis-required)
5. [Problem 3: Docker-to-Host Networking on Linux](#5-problem-3-docker-to-host-networking-on-linux)
6. [Problem 4: Port Conflicts on Host Network](#6-problem-4-port-conflicts-on-host-network)
7. [Problem 5: QR Code Infinite Reconnection Loop (Critical Bug)](#7-problem-5-qr-code-infinite-reconnection-loop-critical-bug)
8. [The Final Working Configuration](#8-the-final-working-configuration)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Webhook Events Reference](#10-webhook-events-reference)
11. [Lessons Learned](#11-lessons-learned)

---

## 1. What is Evolution API

Evolution API is an open-source REST API that provides a programmatic interface for interacting with WhatsApp. It works as a middleware layer that connects to WhatsApp Web through the **Baileys** protocol (an unofficial WhatsApp Web library), exposing HTTP endpoints that allow you to:

- Send text messages, images, documents, audio, locations, and contacts
- Receive incoming messages via webhooks
- Manage WhatsApp instances (connect/disconnect, QR code generation)
- Handle groups, contacts, and profile settings

**How Baileys works:** Instead of using Meta's official WhatsApp Business API (which requires a Meta Business account and approval), Baileys reverse-engineers the WhatsApp Web protocol. You connect by scanning a QR code — exactly like opening WhatsApp Web on your browser. This is free but unofficial, meaning Meta could change the protocol at any time or ban numbers that use it.

**Official resources:**
- GitHub: https://github.com/EvolutionAPI/evolution-api
- Documentation: https://doc.evolution-api.com
- Postman Collection: https://www.postman.com/agenciadgcode/evolution-api/

---

## 2. Docker Image Confusion: Two Different Providers

This was one of the most confusing aspects of setting up Evolution API. There are **two different Docker image providers**, and using the wrong one will result in a broken setup.

### The old image (v2.2.x and earlier)

```
atendai/evolution-api
```

Available tags on Docker Hub (`hub.docker.com/r/atendai/evolution-api/tags`):

| Tag | Date |
|-----|------|
| `latest` | 2025-02-03 |
| `v2.2.3` | 2025-02-03 |
| `v2.2.2` | 2025-01-31 |
| `v2.2.1` | 2025-01-22 |
| `v1.8.7` | 2025-06-02 |
| `v1.8.6` | 2025-05-22 |

**CRITICAL:** The `latest` tag on `atendai/evolution-api` points to **v2.2.3**, which is from February 2025. This version has a critical QR code generation bug (see Problem 5 below). The `atendai` registry was **abandoned** after v2.2.3 — no newer v2.x versions were published there.

### The new image (v2.3.x and later)

```
evoapicloud/evolution-api
```

Available tags on Docker Hub (`hub.docker.com/r/evoapicloud/evolution-api/tags`):

| Tag | Approximate Date |
|-----|-----------------|
| `v2.3.7` | December 2024 |
| `v2.3.6` | October 2024 |
| `v2.3.5` | October 2024 |
| `v2.3.4` | September 2024 |
| `v2.3.3` | September 2024 |
| `v2.3.2` | September 2024 |
| `v2.3.1` | July 2024 |
| `v2.3.0` | June 2024 |

**The bottom line:** Starting from v2.3.0, Evolution API moved to the `evoapicloud/evolution-api` Docker image. If you use `atendai/evolution-api:latest`, you get the buggy v2.2.3. Always use:

```yaml
image: evoapicloud/evolution-api:v2.3.7  # or the latest available tag
```

### How we discovered this

1. We initially used `atendai/evolution-api:latest` because that's what most tutorials and the official Docker documentation referenced.
2. After discovering the QR code bug in v2.2.3, we searched for newer versions.
3. Attempting to pull `atendai/evolution-api:v2.3.7` failed with "manifest unknown" — the tag simply doesn't exist in that registry.
4. A Docker Hub search revealed the `evoapicloud/evolution-api` registry, which contains all v2.3.x releases.

---

## 3. Problem 1: Database Provider Required

### Symptom

```
Error: Database provider  invalid.
```

The container would crash-loop (restart repeatedly) with this error in the logs.

### Cause

Evolution API v2.x requires a database to store instance data, message history, and configuration. The `DATABASE_PROVIDER` environment variable was not set, and the API couldn't start without it.

### Solution

Add PostgreSQL as a dependency and configure the database connection:

```yaml
services:
  evolution-api:
    environment:
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution@localhost:5433/evolution
      - DATABASE_CONNECTION_CLIENT_NAME=evolution

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolution
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evolution"]
      interval: 5s
      timeout: 5s
      retries: 5
```

**Important:** We use a `healthcheck` on PostgreSQL and `depends_on` with `condition: service_healthy` in the evolution-api service to ensure PostgreSQL is fully ready before Evolution API starts. Without this, Evolution API might try to connect before PostgreSQL accepts connections.

---

## 4. Problem 2: Redis Required

### Symptom

```
ERROR [Redis] redis disconnected
```

This error repeated every second in the Evolution API logs. While the API technically started and responded to HTTP requests, internal caching and session management were broken.

### Cause

Evolution API v2.x uses Redis for caching and session management. Without Redis, the API runs in a degraded state.

### Solution

Add Redis to the Docker Compose stack:

```yaml
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
```

And configure Evolution API to use it:

```yaml
  evolution-api:
    environment:
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://localhost:6380
      - CACHE_LOCAL_ENABLED=false
```

---

## 5. Problem 3: Docker-to-Host Networking on Linux

### Symptom

Evolution API (running inside Docker) could not reach the Node.js webhook server running on the host machine at `http://host.docker.internal:3000/webhook`. Logs showed:

```
Error: connect ETIMEDOUT 172.17.0.1:3000
```

And webhook delivery failed, which meant:
- QR code events were never delivered
- Connection status updates never arrived
- Incoming WhatsApp messages would never reach the bot

### Cause

On **Linux**, `host.docker.internal` resolves to the Docker bridge gateway IP (e.g., `172.17.0.1` or `172.22.0.1`). However, the host's firewall (iptables/nftables) often blocks traffic from Docker bridge networks to the host.

This is a well-known Linux-specific issue. On **macOS** and **Windows**, Docker Desktop handles `host.docker.internal` transparently because Docker runs in a VM with special networking.

### What we tried (and failed)

1. **Adding `extra_hosts` to docker-compose.yml:**
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```
   This correctly resolved the hostname but the connection still timed out due to the firewall.

2. **Adding iptables rules to allow Docker traffic:**
   ```bash
   sudo iptables -I INPUT -s 172.17.0.0/16 -j ACCEPT
   sudo iptables -I INPUT -s 172.22.0.0/16 -j ACCEPT
   ```
   This didn't work — the firewall configuration was more restrictive than expected.

3. **Testing connectivity from inside the container:**
   ```bash
   docker exec evolution-api sh -c "wget -q -O- --timeout=5 http://host.docker.internal:3000/"
   # Result: download timed out

   docker exec evolution-api sh -c "wget -q -O- --timeout=3 http://172.22.0.1:3000/"
   # Result: download timed out

   docker exec evolution-api sh -c "wget -q -O- --timeout=3 http://192.168.15.2:3000/"
   # Result: download timed out
   ```
   Every approach to reach the host from the container failed.

### Solution: Host Network Mode

The solution was to switch Evolution API to `network_mode: host`, which makes the container share the host's network stack directly — no bridge, no NAT, no firewall issues:

```yaml
services:
  evolution-api:
    network_mode: host
    # No "ports" needed — the container IS on the host network
```

With host networking:
- Evolution API listens on `localhost:8080` (directly on the host)
- It can reach the webhook server at `http://localhost:3000/webhook` (also on the host)
- No bridge networking, no firewall traversal needed

**Trade-off:** Host network mode means the container shares ALL host ports. If port 8080 were already in use on the host, it would conflict. For local development, this is acceptable.

**Important:** When using `network_mode: host`, the Evolution API connects to Redis and PostgreSQL via `localhost` too, so those services need to expose their ports to the host (see next problem).

---

## 6. Problem 4: Port Conflicts on Host Network

### Symptom

```
Bind for 0.0.0.0:6379 failed: port is already allocated
```

### Cause

Since Evolution API now runs with `network_mode: host` and connects to Redis/PostgreSQL via `localhost`, these services need to expose their ports to the host. However, ports **6379** (Redis) and **5432** (PostgreSQL) were already in use by other services on the host machine.

### Solution

Remap the container ports to avoid conflicts:

```yaml
  redis:
    ports:
      - "6380:6379"  # Host port 6380 maps to container port 6379

  postgres:
    ports:
      - "5433:5432"  # Host port 5433 maps to container port 5432
```

And update the Evolution API connection URIs to use the remapped ports:

```yaml
  evolution-api:
    environment:
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution@localhost:5433/evolution
      - CACHE_REDIS_URI=redis://localhost:6380
```

---

## 7. Problem 5: QR Code Infinite Reconnection Loop (Critical Bug)

This was the most time-consuming problem to diagnose and the most critical to solve.

### Symptom

After creating a WhatsApp instance, the connection status would be stuck at `"connecting"` forever. The logs showed an infinite loop:

```
INFO [ChannelStartupService] Browser: Evolution API,Chrome,6.17.0-14-generic
INFO [ChannelStartupService] Baileys version env: 2,3000,1015901307
INFO [ChannelStartupService] Group Ignore: true
```

These three lines repeated every 2-4 seconds indefinitely. No QR code was ever generated, and the `/instance/connect/{instance}` endpoint always returned `{"count": 0}`.

The browser page at `/qrcode` showed "Connection Status: connecting" forever, never displaying a QR code.

### Diagnosis

1. **Network was not the issue:** We verified the container could reach WhatsApp's servers:
   ```bash
   docker exec evolution-api sh -c "wget -q -O- --timeout=5 https://web.whatsapp.com"
   # Successfully returned the WhatsApp Web HTML page
   ```

2. **The API was functional:** Creating instances, setting webhooks, and querying connection state all worked. Only QR code generation was broken.

3. **Webhook delivery was working:** After fixing the host networking issue, webhook events for `connection.update` were being delivered successfully — they all said `state: "connecting"`.

4. **No QR code events were ever emitted:** Searching the entire Docker log for "qr" or "QR" returned only the initial configuration flag `qrcode: true`. No `qrcode.updated` event was ever generated.

### Root Cause

This is a **confirmed bug in Evolution API v2.2.3** (which is what `atendai/evolution-api:latest` pulls).

The bug is documented in these GitHub issues:
- [Bug Fix: QR Code Infinite Reconnection Loop (PR #2365)](https://github.com/EvolutionAPI/evolution-api/pull/2365)
- [EvolutionAPI can no longer generate QR Code (Issue #2166)](https://github.com/EvolutionAPI/evolution-api/issues/2166)
- [BUG Loop on start instance baileys report log (Issue #2184)](https://github.com/EvolutionAPI/evolution-api/issues/2184)
- [Baileys WS Connection Error - Cannot generate QR Code (Issue #1014)](https://github.com/EvolutionAPI/evolution-api/issues/1014)

**Technical explanation:** In the Baileys integration code (`whatsapp.baileys.service.ts`), the WebSocket connection to WhatsApp's servers goes through several stages:

1. Open WebSocket connection
2. WhatsApp sends a challenge
3. Baileys responds and requests a QR code
4. The connection briefly **closes** (this is normal — WhatsApp's protocol does this)
5. Baileys should then generate the QR code from the challenge data

The bug: In v2.2.3, the `connectionUpdate` event handler sees the connection close in step 4 and immediately triggers `shouldReconnect` logic. Since the `statusCode` is `undefined` during the first connection attempt (no QR has been generated yet), the code incorrectly assumes it should reconnect. This creates an infinite loop:

```
Connect → WhatsApp closes connection → shouldReconnect triggers → Connect again → ...
```

The QR code is never generated because the connection handler restarts before Baileys can process the challenge data.

### The Fix (in v2.3.x)

The fix (PR #2365) added an `isInitialConnection` check that prevents reconnection attempts when:
- The instance is not yet authenticated
- No QR code has been generated yet

This allows the first connection to close gracefully so Baileys can generate the QR code.

### Solution

Switch from the old `atendai/evolution-api:latest` (v2.2.3) to the new `evoapicloud/evolution-api:v2.3.7`:

```yaml
services:
  evolution-api:
    # OLD (BROKEN): image: atendai/evolution-api:latest
    image: evoapicloud/evolution-api:v2.3.7
```

This single change fixed the QR code generation issue completely.

---

## 8. The Final Working Configuration

After solving all five problems, here is the complete working `docker-compose.yml`:

```yaml
services:
  evolution-api:
    image: evoapicloud/evolution-api:v2.3.7
    container_name: evolution-api
    restart: unless-stopped
    network_mode: host
    environment:
      - AUTHENTICATION_API_KEY=your-evolution-api-key-here
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - SERVER_URL=http://localhost:8080
      - DEL_INSTANCE=false
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution@localhost:5433/evolution
      - DATABASE_CONNECTION_CLIENT_NAME=evolution
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://localhost:6380
      - CACHE_LOCAL_ENABLED=false
      - LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
    volumes:
      - evolution_data:/evolution/instances
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgres:
    image: postgres:16-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    ports:
      - "5433:5432"
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolution
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evolution"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  evolution_data:
  postgres_data:
```

### Environment Variables Explained

| Variable | Value | Purpose |
|----------|-------|---------|
| `AUTHENTICATION_API_KEY` | Your chosen key | API key for authenticating requests to Evolution API. You define this yourself. |
| `AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES` | `true` | Allows fetching instance details including the API key |
| `SERVER_URL` | `http://localhost:8080` | The public URL of the Evolution API (used in webhooks and responses) |
| `DEL_INSTANCE` | `false` | Prevents automatic deletion of disconnected instances |
| `DATABASE_PROVIDER` | `postgresql` | Required — tells Evolution API which database to use |
| `DATABASE_CONNECTION_URI` | PostgreSQL connection string | Points to the PostgreSQL container (via host port 5433) |
| `DATABASE_CONNECTION_CLIENT_NAME` | `evolution` | Client name for database connections |
| `CACHE_REDIS_ENABLED` | `true` | Enables Redis caching |
| `CACHE_REDIS_URI` | `redis://localhost:6380` | Points to the Redis container (via host port 6380) |
| `CACHE_LOCAL_ENABLED` | `false` | Disables local (in-memory) caching in favor of Redis |
| `LOG_LEVEL` | Multiple levels | Controls which log levels are printed |

### Startup Order

1. **PostgreSQL** starts first, with a healthcheck (`pg_isready`)
2. **Redis** starts in parallel with PostgreSQL, with a healthcheck (`redis-cli ping`)
3. **Evolution API** starts only after both PostgreSQL and Redis report healthy
4. The Node.js chatbot (`npm start`) should be started after the Docker containers are up

### Verification Steps

After running `docker compose up -d`, verify everything is working:

```bash
# Check all containers are running
docker ps

# Verify Evolution API responds
curl http://localhost:8080/
# Expected: {"status":200,"message":"Welcome to the Evolution API, it is working!","version":"2.3.7",...}

# Check for errors in logs
docker logs evolution-api --tail 20
# Should see: redis ready, Repository:Prisma - ON, HTTP - ON: 8080
# Should NOT see: Database provider invalid, redis disconnected
```

---

## 9. API Endpoints Reference

These are the Evolution API endpoints used by our chatbot:

### Create Instance

```
POST /instance/create
Header: apikey: <your-api-key>
Content-Type: application/json

{
  "instanceName": "whatsapp-bot",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "rejectCall": false,
  "groupsIgnore": true,
  "alwaysOnline": false,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": false
}
```

- `integration`: `"WHATSAPP-BAILEYS"` for the free QR code method, `"WHATSAPP-BUSINESS"` for the official Meta API
- `qrcode: true`: Automatically initiates the connection process after creation
- Returns instance details including a generated hash (API key for this specific instance)

### Connect Instance (Get QR Code)

```
GET /instance/connect/{instanceName}
Header: apikey: <your-api-key>
```

Returns QR code data as base64 if available, or `{"count": 0}` if no QR code is pending.

### Check Connection State

```
GET /instance/connectionState/{instanceName}
Header: apikey: <your-api-key>
```

Returns: `{"instance": {"instanceName": "...", "state": "open|close|connecting"}}`

### Set Webhook

```
POST /webhook/set/{instanceName}
Header: apikey: <your-api-key>
Content-Type: application/json

{
  "webhook": {
    "enabled": true,
    "url": "http://localhost:3000/webhook",
    "webhookByEvents": false,
    "webhookBase64": false,
    "events": [
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE"
    ]
  }
}
```

### Send Text Message

```
POST /message/sendText/{instanceName}
Header: apikey: <your-api-key>
Content-Type: application/json

{
  "number": "5511999999999",
  "text": "Hello from the bot!"
}
```

- `number`: Phone number with country code, no `+` prefix
- Returns message details including `key.id` (message ID) and `status: "PENDING"`

### Delete Instance

```
DELETE /instance/delete/{instanceName}
Header: apikey: <your-api-key>
```

---

## 10. Webhook Events Reference

When events occur, Evolution API sends POST requests to your configured webhook URL.

### Event: `connection.update`

Fired when the WhatsApp connection status changes.

```json
{
  "event": "connection.update",
  "instance": "whatsapp-bot",
  "data": {
    "instance": "whatsapp-bot",
    "state": "connecting",
    "statusReason": 200
  }
}
```

Possible states: `"connecting"`, `"open"`, `"close"`

### Event: `qrcode.updated`

Fired when a new QR code is generated for WhatsApp pairing.

```json
{
  "event": "qrcode.updated",
  "instance": "whatsapp-bot",
  "data": {
    "qrcode": {
      "base64": "data:image/png;base64,..."
    }
  }
}
```

### Event: `messages.upsert`

Fired when a message is received (or sent). This is the main event for chatbot functionality.

```json
{
  "event": "messages.upsert",
  "instance": "whatsapp-bot",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE594145F4C59B4"
    },
    "message": {
      "conversation": "Hello bot!"
    },
    "messageTimestamp": "1717689097"
  }
}
```

Key fields:
- `data.key.remoteJid`: The sender's WhatsApp ID (format: `{phone}@s.whatsapp.net` for individuals, `{id}@g.us` for groups)
- `data.key.fromMe`: `true` if the message was sent by the connected account (your bot), `false` if received
- `data.message.conversation`: Plain text message content
- `data.message.extendedTextMessage.text`: Rich text message content (when the message contains links, mentions, etc.)

**Important:** The `messages.upsert` event fires for ALL messages — both incoming and outgoing. Always check `data.key.fromMe` to avoid responding to your own bot's messages (infinite loop).

---

## 11. Lessons Learned

### 1. Don't trust `latest` Docker tags

The `atendai/evolution-api:latest` tag pointed to v2.2.3, which was over a year old and had a critical bug. Always pin to a specific version and verify it's the one you expect.

### 2. Evolution API has mandatory infrastructure requirements

Unlike simpler APIs, Evolution API v2.x cannot run standalone. It requires:
- **PostgreSQL** (mandatory — will crash without it)
- **Redis** (strongly recommended — logs errors without it and may have degraded functionality)

### 3. Docker networking on Linux is different from macOS/Windows

The `host.docker.internal` hostname that works seamlessly on macOS/Windows Docker Desktop often doesn't work on Linux due to firewall rules. Solutions:
- Use `network_mode: host` (simplest for local dev)
- Configure iptables to allow Docker bridge traffic
- Use a reverse proxy or tunnel

### 4. Always check container logs when something doesn't work

```bash
docker logs <container-name> --tail 50
```

This revealed every problem: the missing database provider, Redis disconnection, and the reconnection loop.

### 5. The QR code generation is fragile

The Baileys library's QR code generation depends on a precise sequence of WebSocket events. If anything interrupts this sequence (reconnection logic, network timeouts, wrong library version), the QR code simply never appears — with no error message.

### 6. Always use healthchecks and `depends_on` with conditions

Without healthchecks, Docker will start Evolution API before PostgreSQL is ready, causing connection errors. The `depends_on` with `condition: service_healthy` ensures proper startup order.

---

## Quick Reference: Start from Scratch

If you need to set up Evolution API from scratch on a Linux machine:

```bash
# 1. Use the correct Docker image
# DO NOT use: atendai/evolution-api:latest (broken v2.2.3)
# USE: evoapicloud/evolution-api:v2.3.7

# 2. Start the stack
docker compose up -d

# 3. Wait for it to be ready (10-15 seconds)
sleep 15

# 4. Verify it's working
curl http://localhost:8080/
# Should return: {"status":200,"version":"2.3.7",...}

# 5. Check for errors
docker logs evolution-api --tail 20
# Should see "HTTP - ON: 8080" with no errors

# 6. Start your chatbot
npm start

# 7. Open QR code page and scan with WhatsApp
# http://localhost:3000/qrcode

# 8. Troubleshooting: if something is broken, reset everything
docker compose down -v  # -v removes volumes (clean slate)
docker compose up -d
```
