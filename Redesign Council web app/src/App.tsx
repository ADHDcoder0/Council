import {
  Book,
  Button,
  Home,
  IconButton,
  MessageCircle,
  Settings,
  Star,
  ThemeProvider,
  Tooltip,
  useTheme,
} from "@figma/astraui"
import { useEffect, useState } from "react"
import {
  CostFrame,
  DebateStage,
  HistoryFrame,
  KeysFrame,
  NewDebateFrame,
  SettingsFrame,
  type DemoState,
  type Direction,
  type ProductScreen,
} from "@/components/redesign/CouncilComponents"

const directionCopy: Record<Direction, {
  number: string
  name: string
  label: string
  rationale: string
}> = {
  thread: {
    number: "01",
    name: "The Deliberation",
    label: "Conversation-first",
    rationale:
      "A long-form reading surface makes the argument—not the machinery—the center of attention. Member identity stays visible through a compact cast strip and colored transcript rules. Controls appear as a single dock at the moment they are useful. This direction best supports careful reading and steering over long sessions.",
  },
  arena: {
    number: "02",
    name: "The Roundtable",
    label: "Stage and arena",
    rationale:
      "The question sits at the center while members occupy stable positions around it. Speaker emphasis makes turn-taking instantly legible and gives the council a sense of presence without anthropomorphic avatars. A live transcript below preserves detail when the spatial overview is not enough. This direction fits short, active debates where pacing matters.",
  },
  workbench: {
    number: "03",
    name: "The Workbench",
    label: "Professional workspace",
    rationale:
      "A modular canvas exposes the roster, transcript, live diagnostics, and cost at once. Dense panels make comparison and intervention efficient for users who treat debates as repeatable analytical work. Each panel can become rearrangeable later without changing the information model. This direction fits high-frequency use and operational scrutiny.",
  },
}

const screens: { id: ProductScreen label: string }[] = [
  { id: "debate", label: "Debate" },
  { id: "new", label: "New debate" },
  { id: "settings", label: "Settings" },
  { id: "keys", label: "Keys" },
  { id: "cost", label: "Cost" },
  { id: "history", label: "History" },
]

const states: { id: DemoState label: string }[] = [
  { id: "streaming", label: "Streaming" },
  { id: "failed", label: "Member failed" },
  { id: "stopped", label: "Stop requested" },
  { id: "missing-key", label: "Missing key" },
  { id: "muted", label: "Muted" },
  { id: "long", label: "Long content" },
  { id: "first-run", label: "First run" },
  { id: "confirm", label: "Destructive" },
]

function DirectionContent({
  direction,
  screen,
  state,
  onStateChange,
}: {
  direction: Direction
  screen: ProductScreen
  state: DemoState
  onStateChange: (state: DemoState) => void
}) {
  if (screen === "new") return <NewDebateFrame />
  if (screen === "settings")
    return <SettingsFrame confirm={state === "confirm"} />
  if (screen === "keys") return <KeysFrame invalid={state === "missing-key"} />
  if (screen === "cost") return <CostFrame />
  if (screen === "history") return <HistoryFrame />
  return (
    <DebateStage
      direction={direction}
      onStateChange={onStateChange}
      state={state}
    />
  )
}

function CouncilDesignStudy() {
  const { theme, setTheme } = useTheme()
  const [direction, setDirection] = useState<Direction>("thread")
  const [screen, setScreen] = useState<ProductScreen>("debate")
  const [state, setState] = useState<DemoState>("streaming")
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    if (!window.localStorage.getItem("astra-theme")) setTheme("dark")
  }, [setTheme])

  const concept = directionCopy[direction]

  return (
    <div className="design-study">
      <header className="study-header">
        <div className="study-brand">
          <div className="study-brand__mark">
            <Home size={18} />
          </div>
          <div>
            <strong>Council</strong>
            <span>Design directions</span>
          </div>
        </div>
        <div className="direction-tabs" aria-label="Design directions">
          {(Object.keys(directionCopy) as Direction[]).map((item) => (
            <Button
              className={direction === item ? "is-selected" : ""}
              key={item}
              onClick={() => setDirection(item)}
              size="small"
              type="button"
              variant="subtle"
            >
              <code>{directionCopy[item].number}</code>
              {directionCopy[item].name}
            </Button>
          ))}
        </div>
        <div className="study-actions">
          <Button
            className={narrow ? "is-selected" : ""}
            onClick={() => setNarrow((value) => !value)}
            size="small"
            type="button"
            variant="neutral"
          >
            {narrow ? "Desktop frame" : "Narrow frame"}
          </Button>
          <Tooltip content={`Use ${theme === "dark" ? "light" : "dark"} theme`}>
            <IconButton
              aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
              icon={<Star size={16} />}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              size="small"
              type="button"
              variant="subtle"
            />
          </Tooltip>
        </div>
      </header>

      <section className="concept-intro">
        <div>
          <code>{concept.number}</code>
          <span className="section-kicker">{concept.label}</span>
          <div className="concept-title">{concept.name}</div>
        </div>
        <p>{concept.rationale}</p>
        <div className="recommendation">
          <span className="section-kicker">Recommendation</span>
          <strong>Take The Deliberation forward.</strong>
          <p>
            It keeps reasoning readable under long responses, scales down to
            narrow widths naturally, and makes intervention available without
            turning the debate into a dashboard.
          </p>
        </div>
      </section>

      <nav className="review-controls" aria-label="Review frames">
        <div className="review-controls__group">
          <span>Frame</span>
          {screens.map((item) => (
            <Button
              className={screen === item.id ? "is-selected" : ""}
              iconStart={
                item.id === "debate" ? (
                  <MessageCircle size={15} />
                ) : item.id === "history" ? (
                  <Book size={15} />
                ) : item.id === "settings" || item.id === "keys" ? (
                  <Settings size={15} />
                ) : undefined
              }
              key={item.id}
              onClick={() => setScreen(item.id)}
              size="small"
              type="button"
              variant="subtle"
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="review-controls__group review-controls__states">
          <span>State</span>
          {states.map((item) => (
            <Button
              className={state === item.id ? "is-selected" : ""}
              key={item.id}
              onClick={() => setState(item.id)}
              size="small"
              type="button"
              variant="subtle"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <main className="study-canvas">
        <section
          className={`concept-frame direction-${direction} ${
            narrow ? "is-narrow" : ""
          }`}
        >
          <div className="concept-frame__chrome">
            <div className="frame-brand">
              <Home size={16} />
              <strong>Council</strong>
              <code>LOCAL · 127.0.0.1</code>
            </div>
            <div className="frame-actions">
              <Button size="small" type="button" variant="subtle">
                History
              </Button>
              <Button size="small" type="button" variant="subtle">
                Settings
              </Button>
              <Button size="small" type="button" variant="primary">
                New debate
              </Button>
            </div>
          </div>
          <DirectionContent
            direction={direction}
            onStateChange={setState}
            screen={screen}
            state={state}
          />
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <CouncilDesignStudy />
    </ThemeProvider>
  )
}
