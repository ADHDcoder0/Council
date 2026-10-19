export type Direction = "thread" | "arena" | "workbench"
export type ProductScreen = "debate" | "new" | "settings" | "keys" | "cost" | "history"
export type DemoState = "streaming" | "failed" | "stopped" | "missing-key" | "muted" | "long" | "first-run" | "confirm"

export type MemberTone = "skeptic" | "builder" | "visionary" | "chair"

export interface Member {
  id: string
  name: string
  provider: string
  model: string
  role: string
  tone: MemberTone
  chair?: boolean
}

export const councilMembers: Member[] = [
  {
    id: "skeptic",
    name: "Skeptic",
    provider: "Anthropic",
    model: "claude-sonnet-5-5",
    role: "Tests assumptions and names hidden risks.",
    tone: "skeptic",
  },
  {
    id: "builder",
    name: "Builder",
    provider: "OpenAI",
    model: "gpt-4o",
    role: "Turns arguments into practical next steps.",
    tone: "builder",
  },
  {
    id: "visionary",
    name: "Visionary",
    provider: "Gemini",
    model: "gemini-2.5-flash",
    role: "Looks beyond the current constraints.",
    tone: "visionary",
  },
  {
    id: "chair",
    name: "Chair",
    provider: "Anthropic",
    model: "claude-sonnet-5-5",
    role: "Synthesizes disagreement into a decision.",
    tone: "chair",
    chair: true,
  },
]

export const topic =
  "Should engineering teams prefer a modular monolith over microservices by default when the organization expects rapid growth across several product lines?"
