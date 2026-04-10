import { config } from "../config.js";

const baseUrl = () => `${config.evolutionApiUrl}/message`;
const instance = () => config.evolutionInstanceName;
const headers = () => ({
  "Content-Type": "application/json",
  apikey: config.evolutionApiKey,
});

export async function sendText(phone: string, text: string): Promise<void> {
  try {
    await fetch(`${baseUrl()}/sendText/${instance()}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ number: phone, text }),
    });
  } catch (err) {
    console.error("Evolution API sendText error:", err);
  }
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
  try {
    await fetch(`${baseUrl()}/sendButtons/${instance()}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ number: phone, title, description, footer, buttons }),
    });
  } catch (err) {
    console.error("Evolution API sendButtons error:", err);
  }
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
  try {
    await fetch(`${baseUrl()}/sendList/${instance()}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ number: phone, title, description, buttonText, sections }),
    });
  } catch (err) {
    console.error("Evolution API sendList error:", err);
  }
}
