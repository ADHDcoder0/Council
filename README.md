# ⚖️ Council CLI

A command-line tool that convenes a panel of AI models from different providers (Anthropic, OpenAI, Gemini, OpenRouter) to debate topics in round-robin turns. You can interject between rounds, mute/unmute members, request objective Chair syntheses, or let an AI moderator steer the debate.

---

## 🚀 Quick Start

### Installation

Install with `pipx` (recommended) or in a Python virtual environment (Python 3.11+):

```bash
# Using pipx
pipx install .

# Or using pip in a venv
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

---

## 🔑 Provider Setup

Council supports four major AI model providers using environment variables only. Set any or all of the following:

| Provider | Environment Variable | Recommended Default Model | Description |
|---|---|---|---|
| **Anthropic** | `ANTHROPIC_API_KEY` | `claude-sonnet-5-5` | Claude Sonnet / Haiku / Opus |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o` | GPT-4o, GPT-4o-mini, o1, o3-mini |
| **Google Gemini** | `GEMINI_API_KEY` | `gemini-2.5-flash` | Gemini 2.5 Flash / Pro (4× token budget) |
| **OpenRouter** | `OPENROUTER_API_KEY` | `anthropic/claude-sonnet-5-5` | Unified access to hundreds of open/closed models |

### First-Run Setup Wizard

Council will automatically run its setup wizard the first time you invoke a command if `~/.config/council/config.toml` does not exist:
- **Multiple keys detected:** Builds a balanced multi-provider council from your available keys.
- **Single key detected:** Assigns all debate roles to that provider so you can immediately begin debating.
- **No keys detected:** Writes a template configuration file with instructions.

Verify your setup at any time with:
```bash
council doctor
```

---

## 💬 Usage & Commands

### 1. One-Shot Debate (`council run`)

Run a debate for a designated number of rounds and output colored panels with a final Chair summary:

```bash
# Standard 2-round debate
council run "Rust or Go for a CLI?" --rounds 2

# Save the debate transcript to Markdown in ~/council-sessions/
council run "Monolith vs Microservices" --rounds 3 --save

# AI Moderator mode: dynamic turn-picking ending naturally or at a 12-turn hard cap
council run "Is artificial general intelligence near?" --moderator
```

### 2. Interactive Session (`council chat`)

Start an interactive multi-round session where you can interject between turns:

```bash
council chat "Should we migrate to Kubernetes?"
```

#### In-Session Slash Commands:
- `Plain text`: Types your interjection and triggers configured debate rounds.
- `/run`: Executes a debate round without typing a user message.
- `/summary`: Calls upon the neutral Chair to synthesize agreements, disagreements, and give a recommendation.
- `/rounds N`: Sets the number of rounds executed per prompt.
- `/members`: Lists current council members and their active/muted status.
- `/mute <name>`: Temporarily silences a member for subsequent rounds.
- `/unmute <name>`: Restores a muted member to the debate.
- `/clear`: Clears the in-memory transcript.
- `/save [path]`: Saves the current session to Markdown (`~/council-sessions/`).
- `/quit` or `/exit`: Exits the session cleanly and displays token and cost statistics.
- `Ctrl+C`: Instantly cancels an in-flight API call and returns to the interactive prompt.

### 3. Resume Past Sessions (`council resume`)

Reload any saved Markdown debate from `~/council-sessions/` and continue interacting:

```bash
council resume ~/council-sessions/20261020-003047-monolith-vs-microservices.md
```

### 4. Manage Council Members (`council members`)

```bash
# List all configured members
council members list

# Add a new debater
council members add "Pragmatist" openai gpt-4o-mini --role "Focuses on cost and immediate shipping"

# Edit an existing member
council members edit Pragmatist --role "Focuses on extreme simplicity"

# Remove a member
council members remove Pragmatist
```

### 5. Local Web UI (`council web`)

Launch the local graphical web interface running on `http://127.0.0.1:8000`:

```bash
council web

# Custom port or interface
council web --port 8080 --host 127.0.0.1
```

**Web UI Features:**
- **Live SSE Streaming**: Watch each council member formulate their responses token-by-token.
- **Color-Coded Speaker Cards**: Instant speaker recognition matching CLI themes (Skeptic in red, Builder in green, Visionary in cyan, Chair in gold).
- **Interactive Sidebar**: Toggle mute status on any debater, view active speaking indicators, and edit member roles/models on the fly.
- **Session History & Resumption**: Browse, search, and reload saved Markdown debates directly from `~/council-sessions/`.
- **Exact Token & Cost Tracking**: Captures real provider token metrics (`input_tokens`, `output_tokens`) from SSE streams with automatic fallback to heuristics and an `exact` vs `est.` badge.
- **Export Options**: Download active debate transcripts as formatted Markdown (`.md`) or structured JSON (`.json`).
- **Custom Price Overrides**: Manage token pricing per model via `~/.config/council/prices.toml`.
- **Zero Node Runtime Dependency**: Single-page React application is pre-compiled into static assets and served directly by FastAPI.

---

## ⚙️ Configuration File (`~/.config/council/config.toml`)

Council stores its configuration in standard TOML format:

```toml
[settings]
words = 120          # Max words per response
window = 40          # Previous messages visible to each model
rounds = 1           # Default rounds per turn

rules = "Respond to others by name, add something new each turn, plain text only."

[[members]]
name = "Skeptic"
provider = "anthropic"
model = "claude-sonnet-5-5"
role = "Finds weak assumptions and risks, fair but never just agrees"
chair = false

[[members]]
name = "Builder"
provider = "openai"
model = "gpt-4o"
role = "Practical steps, trade-offs, cost, simplest thing that works"
chair = false

[[members]]
name = "Visionary"
provider = "gemini"
model = "gemini-2.5-flash"
role = "Bold alternatives and long-term thinking"
chair = false

[[members]]
name = "Chair"
provider = "anthropic"
model = "claude-sonnet-5-5"
role = "Neutral summary of agreements and disagreements, plus a recommendation"
chair = true
```

---

## 🧪 Running Tests

Council includes a comprehensive test suite that runs 100% offline without network access using a fake provider:

```bash
pip install -e ".[dev]"
pytest
```
