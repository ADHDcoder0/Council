import type {
  CouncilMember,
  HistoryEntry,
  KeyProvider,
  PriceRow,
  TranscriptEntry,
} from "@/types/council"

export const DEFAULT_TOPIC =
  "Should engineering teams prefer a modular monolith over microservices by default?"

export const members: CouncilMember[] = [
  {
    id: "skeptic",
    name: "Skeptic",
    provider: "Anthropic",
    model: "claude-sonnet-5-5",
    role: "Finds weak assumptions and risks, fair but never just agrees.",
    tone: "skeptic",
  },
  {
    id: "builder",
    name: "Builder",
    provider: "OpenAI",
    model: "gpt-4o",
    role: "Practical steps, trade-offs, cost, and the simplest thing that works.",
    tone: "builder",
  },
  {
    id: "visionary",
    name: "Visionary",
    provider: "Gemini",
    model: "gemini-2.5-flash",
    role: "Bold alternatives and long-term thinking.",
    tone: "visionary",
  },
  {
    id: "chair",
    name: "Chair",
    provider: "Anthropic",
    model: "claude-sonnet-5-5",
    role: "Neutral summary of agreements and disagreements, plus a recommendation.",
    tone: "chair",
    isChair: true,
  },
]

export const transcript: TranscriptEntry[] = [
  {
    id: "prompt",
    kind: "user",
    label: "You",
    text: DEFAULT_TOPIC,
  },
  {
    id: "skeptic-1",
    kind: "member",
    memberId: "skeptic",
    label: "Skeptic",
    provider: "Anthropic",
    model: "claude-sonnet-5-5",
    text: "“By default” hides the hard part. A monolith lowers coordination cost early, but only if teams enforce module ownership and dependency boundaries. Without those constraints, it is merely a distributed-system migration waiting to happen.",
    time: "4.8s",
    tokens: "184 tok",
    cost: "$0.0041",
  },
  {
    id: "builder-1",
    kind: "member",
    memberId: "builder",
    label: "Builder",
    provider: "OpenAI",
    model: "gpt-4o",
    text: "Start with one deployable and make boundaries observable in code. Extract a service only after a boundary has distinct scaling, reliability, or release requirements. That keeps the operational bill proportional to actual need.",
    time: "3.2s",
    tokens: "162 tok",
    cost: "$0.0028",
  },
  {
    id: "visionary-1",
    kind: "member",
    memberId: "visionary",
    label: "Visionary",
    provider: "Gemini",
    model: "gemini-2.5-flash",
    text: "The better default may be an architecture designed for reversible extraction: event seams, contract tests, and data ownership from day one, while retaining a single runtime until the evidence supports separation.",
    time: "2.7s",
    tokens: "151 tok",
    cost: "$0.0012",
  },
  {
    id: "chair-1",
    kind: "chair",
    memberId: "chair",
    label: "Chair",
    provider: "Anthropic",
    model: "claude-sonnet-5-5",
    text: "Recommendation: choose a modular monolith as the default deployment model, but treat modularity as an enforced operating constraint. Define ownership, dependency rules, and extraction criteria before growth makes those decisions political.",
    time: "5.1s",
    tokens: "198 tok",
    cost: "$0.0045",
  },
]

export const keyProviders: KeyProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    placeholder: "sk-ant-api03-…",
    tone: "skeptic",
    docsLabel: "Anthropic console",
  },
  {
    id: "openai",
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    placeholder: "sk-proj-…",
    tone: "builder",
    docsLabel: "OpenAI keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    env: "GEMINI_API_KEY",
    placeholder: "AIzaSy…",
    tone: "visionary",
    docsLabel: "Google AI Studio",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    env: "OPENROUTER_API_KEY",
    placeholder: "sk-or-v1-…",
    tone: "chair",
    docsLabel: "OpenRouter keys",
  },
]

export const prices: PriceRow[] = [
  { model: "claude-sonnet-5-5", input: "3.00", output: "15.00" },
  { model: "claude-3-5-haiku", input: "0.80", output: "4.00" },
  { model: "gpt-4o", input: "2.50", output: "10.00" },
  { model: "gpt-4o-mini", input: "0.15", output: "0.60" },
  { model: "o3-mini", input: "1.10", output: "4.40" },
  { model: "gemini-2.5-flash", input: "0.15", output: "0.60" },
  { model: "gemini-1.5-pro", input: "1.25", output: "5.00" },
  { model: "default", input: "1.50", output: "6.00" },
]

export const historyEntries: HistoryEntry[] = [
  {
    id: "10fb6af1",
    topic: DEFAULT_TOPIC,
    createdAt: "Oct 20, 02:52",
    relativeTime: "12 minutes ago",
    rounds: 2,
    status: "Complete",
    tokens: "2,841",
    cost: "$0.0318",
    members: ["Skeptic", "Builder", "Visionary", "Chair"],
  },
  {
    id: "98ac42d0",
    topic: "Should LLM agent swarms replace traditional workflow engines?",
    createdAt: "Oct 19, 21:14",
    relativeTime: "5 hours ago",
    rounds: 3,
    status: "Complete",
    tokens: "4,293",
    cost: "$0.0472",
    members: ["Skeptic", "Builder", "Chair"],
  },
  {
    id: "54bd810c",
    topic:
      "Is Rust’s borrow checker worth the productivity cost for startup MVPs?",
    createdAt: "Oct 18, 18:07",
    relativeTime: "2 days ago",
    rounds: 1,
    status: "Draft",
    tokens: "1,109",
    cost: "$0.0116",
    members: ["Builder", "Visionary", "Chair"],
  },
  {
    id: "f20a731e",
    topic: "Should synthetic data be the default for local development?",
    createdAt: "Oct 15, 09:32",
    relativeTime: "5 days ago",
    rounds: 2,
    status: "Failed",
    tokens: "792",
    cost: "$0.0084",
    members: ["Skeptic", "Visionary"],
  },
]

export const debateSuggestions = [
  "Should engineering teams prefer a modular monolith over microservices by default?",
  "Will agent swarms make workflow engines obsolete within three years?",
  "Is Rust’s borrow checker worth the productivity cost for startup MVPs?",
  "Should synthetic data be the default for local development?",
]
