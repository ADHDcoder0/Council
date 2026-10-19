export type DemoView = "debate" | "history" | "first-run"

export type DebateState = "empty" | "streaming" | "error"

export type Sheet = "new-debate" | "settings" | "keys" | null

export type SettingsSection = "runtime" | "members" | "prices"

export type MemberTone = "skeptic" | "builder" | "visionary" | "chair" | "user"

export interface CouncilMember {
  id: string
  name: string
  provider: string
  model: string
  role: string
  tone: MemberTone
  isChair?: boolean
}

export type TranscriptKind = "user" | "member" | "chair" | "error"

export interface TranscriptEntry {
  id: string
  kind: TranscriptKind
  memberId?: string
  label: string
  provider?: string
  model?: string
  text: string
  time?: string
  tokens?: string
  cost?: string
  streaming?: boolean
}

export interface KeyProvider {
  id: string
  name: string
  env: string
  placeholder: string
  tone: MemberTone
  docsLabel: string
}

export interface PriceRow {
  model: string
  input: string
  output: string
}

export interface HistoryEntry {
  id: string
  topic: string
  createdAt: string
  relativeTime: string
  rounds: number
  status: "Complete" | "Draft" | "Failed"
  tokens: string
  cost: string
  members: string[]
}
