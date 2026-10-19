export interface MemberInfo {
  name: string;
  provider: string;
  model: string;
  role: string;
  is_chair: boolean;
  is_muted: boolean;
}

export interface TranscriptEntry {
  id?: string;
  round?: number;
  speaker: string;
  text: string;
  is_chair?: boolean;
  timestamp?: string;
  is_streaming?: boolean;
  is_error?: boolean;
  input_tokens?: number;
  output_tokens?: number;
}

export interface SessionResponse {
  session_id: string;
  topic: string;
  words: number;
  members: MemberInfo[];
  transcript: TranscriptEntry[];
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  is_cost_estimated: boolean;
}

export interface SavedSessionItem {
  filename: string;
  filepath: string;
  topic: string;
  date: string;
  message_count: number;
}

export interface CouncilConfigSettings {
  words: number;
  window: number;
  rounds: number;
  rules: string;
}

export interface CouncilConfig {
  settings: CouncilConfigSettings;
  members: Array<{
    name: string;
    provider: string;
    model: string;
    role: string;
    chair?: boolean;
    muted?: boolean;
  }>;
}

export interface ApiKeyInfo {
  provider: string;
  env_var: string;
  is_set: boolean;
  preview: string;
}

export type ApiKeysState = Record<string, ApiKeyInfo>;
