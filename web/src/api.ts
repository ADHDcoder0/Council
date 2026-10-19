import {
  CouncilConfig,
  MemberInfo,
  SavedSessionItem,
  SessionResponse,
  ApiKeysState,
} from "./types";

const BASE_URL = "";

export async function fetchConfig(): Promise<CouncilConfig> {
  const res = await fetch(`${BASE_URL}/api/config`);
  if (!res.ok) throw new Error("Failed to load config");
  return res.json();
}

export async function saveConfig(config: CouncilConfig): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      council: config.settings,
      members: config.members,
    }),
  });
  if (!res.ok) throw new Error("Failed to save config");
}

export async function fetchPrices(): Promise<Record<string, [number, number]>> {
  const res = await fetch(`${BASE_URL}/api/prices`);
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

export async function savePrices(
  prices: Record<string, [number, number]>
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/prices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prices),
  });
  if (!res.ok) throw new Error("Failed to save prices");
}

export async function createSession(
  topic: string,
  words = 120,
  rounds = 1,
  members?: MemberInfo[]
): Promise<SessionResponse> {
  const res = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, words, rounds, members }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function fetchSession(sessionId: string): Promise<SessionResponse> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session");
  return res.json();
}

export async function addMessage(
  sessionId: string,
  speaker: string,
  text: string
): Promise<SessionResponse> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ speaker, text }),
  });
  if (!res.ok) throw new Error("Failed to add message");
  return res.json();
}

export async function patchMember(
  sessionId: string,
  name: string,
  updates: Partial<MemberInfo>
): Promise<MemberInfo> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/members/${name}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update member");
  return res.json();
}

export async function saveSessionToDisk(
  sessionId: string,
  customFilename?: string
): Promise<{ filename: string; filepath: string }> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ custom_filename: customFilename }),
  });
  if (!res.ok) throw new Error("Failed to save session");
  return res.json();
}

export async function fetchHistory(): Promise<SavedSessionItem[]> {
  const res = await fetch(`${BASE_URL}/api/history`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export async function resumeSessionFromFile(
  filepath: string
): Promise<SessionResponse> {
  const res = await fetch(`${BASE_URL}/api/sessions/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filepath }),
  });
  if (!res.ok) throw new Error("Failed to resume session");
  return res.json();
}

export async function fetchApiKeys(): Promise<ApiKeysState> {
  const res = await fetch(`${BASE_URL}/api/keys`);
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json();
}

export async function saveApiKeys(
  keys: Record<string, string>
): Promise<{ status: string; keys: ApiKeysState }> {
  const res = await fetch(`${BASE_URL}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(keys),
  });
  if (!res.ok) throw new Error("Failed to save API keys");
  return res.json();
}

export async function testApiKey(
  provider: string
): Promise<{ status: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/keys/test/${provider}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to test API key");
  return res.json();
}
