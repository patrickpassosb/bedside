# Backend Demo Runbook

Use this when you want to bring the Bedside backend up locally, scan the WhatsApp QR code, and test the seeded patient flow before a live demo.

## Preconditions

- Docker containers are running from `bedside-backend/docker-compose.yml`
- The backend is running on `http://localhost:3000`
- `bedside-backend/.env` is filled in

## One-time setup

From `/home/patrickpassos/GitHub/work/bedside/bedside-backend`:

```bash
bun install
bun run seed
bun run demo:whatsapp prepare
```

What `prepare` does:

- creates the `bedside-whatsapp` instance if it does not exist
- points Evolution API to `http://localhost:3000/webhook/evolution`
- prints the current instance status

## Get the QR code

```bash
bun run demo:whatsapp qr
```

This writes a PNG to:

```bash
/tmp/bedside-whatsapp-qr.png
```

Open that file locally and scan it from WhatsApp:

1. Open WhatsApp on the phone you want to use as the Bedside bot
2. Go to `Linked devices`
3. Tap `Link a device`
4. Scan `/tmp/bedside-whatsapp-qr.png`

You can re-run the QR command at any time if the code expires.

## Confirm the connection

```bash
bun run demo:whatsapp status
curl http://localhost:3000/health
```

Expected status:

- backend health returns `{"status":"healthy",...}`
- WhatsApp instance status becomes `open`

## Seeded patient numbers for testing

Text the connected Bedside number from one of these seeded patient phones:

- `+5511991110001` — Roberto Alves
- `+5511991110002` — Maria Conceicao Santos
- `+5511991110003` — Fabio Lima

## Fast demo script

Send these messages in order:

1. `hoje`
2. `remedios`
3. `estou com muita dor`

Expected behavior:

- `hoje` returns the patient schedule
- `remedios` returns the medication list
- `estou com muita dor` creates a pending escalation

## If something is off

- Re-run `bun run demo:whatsapp prepare`
- Re-run `bun run demo:whatsapp qr`
- Check the backend health endpoint again
- Check `docker logs -f evolution-api`
