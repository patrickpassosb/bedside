type EvolutionInstance = {
  name: string;
  connectionStatus: string | null;
  integration: string | null;
  number: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ConnectionStateResponse = {
  instance?: {
    instanceName?: string;
    state?: string;
  };
};

const evolutionApiUrl = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const evolutionApiKey = process.env.EVOLUTION_API_KEY ?? "";
const evolutionInstanceName = process.env.EVOLUTION_INSTANCE_NAME ?? "bedside-whatsapp";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const [command = "help", customOutputPath] = process.argv.slice(2);

function assertConfigured(): void {
  if (!evolutionApiKey) {
    throw new Error("EVOLUTION_API_KEY is missing in bedside-backend/.env");
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  assertConfigured();

  const response = await fetch(`${evolutionApiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: evolutionApiKey,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  return (await response.json()) as T;
}

async function fetchInstances(): Promise<EvolutionInstance[]> {
  return api<EvolutionInstance[]>("/instance/fetchInstances");
}

async function fetchConnectionState(): Promise<string> {
  const response = await api<ConnectionStateResponse>(
    `/instance/connectionState/${evolutionInstanceName}`
  );

  return response.instance?.state ?? "unknown";
}

async function createInstanceIfMissing(): Promise<void> {
  const instances = await fetchInstances();
  const existing = instances.find((instance) => instance.name === evolutionInstanceName);

  if (existing) {
    console.log(`Instance already exists: ${evolutionInstanceName}`);
    return;
  }

  await api("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: evolutionInstanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      rejectCall: false,
      groupsIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
    }),
  });

  console.log(`Created instance: ${evolutionInstanceName}`);
}

async function setWebhook(): Promise<void> {
  const webhookUrl = `${baseUrl}/webhook/evolution`;

  await api(`/webhook/set/${evolutionInstanceName}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["QRCODE_UPDATED", "MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });

  console.log(`Webhook configured: ${webhookUrl}`);
}

async function writeQrCode(outputPath?: string): Promise<void> {
  const response = await api<{ base64?: string; count?: number }>(
    `/instance/connect/${evolutionInstanceName}`
  );

  if (!response.base64) {
    console.log(`No QR code payload is pending. connect count=${response.count ?? 0}`);
    console.log(`Current state: ${await fetchConnectionState()}`);
    return;
  }

  const filePath = outputPath ?? `/tmp/${evolutionInstanceName}-qr.png`;
  const base64 = response.base64.replace(/^data:image\/png;base64,/, "");

  await Bun.write(filePath, Buffer.from(base64, "base64"));

  console.log(`QR code written to ${filePath}`);
  console.log("Scan it from WhatsApp: Linked devices > Link a device");
}

async function printStatus(): Promise<void> {
  const instances = await fetchInstances();
  const instance = instances.find((item) => item.name === evolutionInstanceName);
  const state = await fetchConnectionState().catch(() => "unknown");

  console.log(`Evolution API: ${evolutionApiUrl}`);
  console.log(`Backend webhook target: ${baseUrl}/webhook/evolution`);
  console.log(`Instance: ${evolutionInstanceName}`);

  if (!instance) {
    console.log("Instance status: missing");
    return;
  }

  console.log(`Connection status: ${instance.connectionStatus ?? "unknown"}`);
  console.log(`State endpoint: ${state}`);
  console.log(`Integration: ${instance.integration ?? "unknown"}`);
  console.log(`Phone number: ${instance.number ?? "not paired yet"}`);
  console.log(`Updated at: ${instance.updatedAt ?? "unknown"}`);
}

function printHelp(): void {
  console.log("Usage: bun run demo:whatsapp <command>");
  console.log("");
  console.log("Commands:");
  console.log("  prepare           Create the instance if needed, configure webhook, print status");
  console.log("  status            Print instance and connection status");
  console.log("  webhook           Configure the backend webhook on the current instance");
  console.log("  qr [output-path]  Write the current QR code PNG to /tmp or a custom path");
}

async function main(): Promise<void> {
  switch (command) {
    case "prepare":
      await createInstanceIfMissing();
      await setWebhook();
      await printStatus();
      break;
    case "status":
      await printStatus();
      break;
    case "webhook":
      await setWebhook();
      break;
    case "qr":
      await writeQrCode(customOutputPath);
      break;
    case "help":
    default:
      printHelp();
      break;
  }
}

await main();
