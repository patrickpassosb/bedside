import { config } from "../config.js";

const baseUrl = () => `${config.evolutionApiUrl}/message`;
const instance = () => config.evolutionInstanceName;
const headers = () => ({
  "Content-Type": "application/json",
  apikey: config.evolutionApiKey,
});

const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEvolutionRequest(
  endpoint: string,
  payload: Record<string, unknown>,
  label: string
): Promise<void> {
  const url = `${baseUrl()}${endpoint}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return;
      }

      const body = await response.text();
      const error = new Error(
        `${label} failed with ${response.status} ${response.statusText}: ${body}`
      );

      if (attempt === 1 && RETRYABLE_STATUS_CODES.has(response.status)) {
        console.warn(`${label} transient failure, retrying once...`, error.message);
        await sleep(300);
        continue;
      }

      throw error;
    } catch (err) {
      if (attempt === 1) {
        console.warn(`${label} network error, retrying once...`, err);
        await sleep(300);
        continue;
      }

      console.error(`${label} error:`, err);
      throw err;
    }
  }
}

export async function sendText(phone: string, text: string): Promise<void> {
  await sendEvolutionRequest(
    `/sendText/${instance()}`,
    { number: phone, text },
    "Evolution API sendText"
  );
}

interface Button {
  buttonId: string;
  buttonText: { displayText: string };
}

export async function sendButtons(
  phone: string,
  title: string,
  description: string,
  footer: string,
  buttons: Button[]
): Promise<void> {
  await sendEvolutionRequest(
    `/sendButtons/${instance()}`,
    { number: phone, title, description, footer, buttons },
    "Evolution API sendButtons"
  );
}

interface ListRow {
  rowId: string;
  title: string;
  description: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

export async function sendList(
  phone: string,
  title: string,
  description: string,
  buttonText: string,
  sections: ListSection[]
): Promise<void> {
  await sendEvolutionRequest(
    `/sendList/${instance()}`,
    { number: phone, title, description, buttonText, sections },
    "Evolution API sendList"
  );
}
