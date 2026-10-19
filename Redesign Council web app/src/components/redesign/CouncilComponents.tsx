import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  Crop,
  Home,
  IconButton,
  InputField,
  MessageCircle,
  Mic,
  MousePointer,
  Play,
  Search,
  SelectField,
  Settings,
  Star,
  SwitchField,
  TextareaField,
  Tooltip,
  Upload,
  X,
} from "@figma/astraui"
import { useMemo, useState, type ReactNode } from "react"

import {
  councilMembers,
  topic,
  type DemoState,
  type Direction,
  type Member,
  type MemberTone,
  type ProductScreen,
} from "./councilData"

export type { DemoState, Direction, Member, MemberTone, ProductScreen }

const longResponse =
  "A modular monolith is not a compromise architecture. It is a deliberate way to defer operational distribution while preserving conceptual boundaries. The important constraint is not the deployment unit but whether ownership, dependencies, data access, and failure modes remain legible. If those boundaries are tested continuously, teams retain the option to extract a service when independent scaling, reliability, or release cadence becomes a demonstrated need rather than an anticipated one. The default should therefore optimize for reversible decisions and low coordination cost, with explicit extraction criteria reviewed as the organization changes."

interface MemberCardProps {
  member: Member
  active?: boolean
  muted?: boolean
  skipped?: boolean
  failed?: boolean
  compact?: boolean
  onMute?: () => void
}

export function MemberCard({
  member,
  active = false,
  muted = false,
  skipped = false,
  failed = false,
  compact = false,
  onMute,
}: MemberCardProps) {
  return (
    <article
      className={`member-card tone-${member.tone} ${
        active ? "is-active" : ""
      } ${muted ? "is-muted" : ""} ${compact ? "is-compact" : ""}`}
    >
      <div className="member-card__top">
        <div className="member-card__identity">
          <span className="identity-dot" aria-hidden="true" />
          <strong>{member.name}</strong>
          {member.chair ? <Badge label="Chair" variant="secondary" /> : null}
        </div>
        <Tooltip content={muted ? "Unmute member" : "Mute member"}>
          <IconButton
            aria-label={muted ? `Unmute ${member.name}` : `Mute ${member.name}`}
            icon={muted ? <X size={16} /> : <Mic size={16} />}
            onClick={onMute}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
      </div>
      <div className="member-card__model">
        <span>{member.provider}</span>
        <code>{member.model}</code>
      </div>
      {!compact ? <p>{member.role}</p> : null}
      {active ? <div className="member-status">Speaking now</div> : null}
      {failed ? (
        <div className="member-status is-danger">Failed this turn</div>
      ) : null}
      {skipped ? <div className="member-status">Skipped next round</div> : null}
    </article>
  )
}

interface StreamingTextProps {
  children: ReactNode
  stopped?: boolean
}

export function StreamingText({
  children,
  stopped = false,
}: StreamingTextProps) {
  return (
    <span className="streaming-text">
      {children}
      {!stopped ? (
        <span className="streaming-caret" aria-hidden="true" />
      ) : null}
    </span>
  )
}

interface TranscriptEntryProps {
  member?: Member
  label?: string
  children: ReactNode
  streaming?: boolean
  error?: boolean
  stopped?: boolean
  user?: boolean
  onRetry?: () => void
}

export function TranscriptEntry({
  member,
  label,
  children,
  streaming = false,
  error = false,
  stopped = false,
  user = false,
  onRetry,
}: TranscriptEntryProps) {
  const tone = user ? "user" : (member?.tone ?? "chair")
  return (
    <article
      className={`transcript-entry tone-${tone} ${error ? "is-error" : ""} ${
        stopped ? "is-stopped" : ""
      }`}
    >
      <div className="transcript-entry__meta">
        <div>
          <span className="identity-dot" aria-hidden="true" />
          <strong>{label ?? member?.name}</strong>
          {streaming ? <Badge label="Streaming" variant="brand" /> : null}
          {error ? <Badge label="Failed" variant="danger" /> : null}
          {stopped ? <Badge label="Stopped" variant="warning" /> : null}
        </div>
        <code>
          {user
            ? "steering note"
            : `${member?.model} · ${error ? "8.0s" : "3.2s"}`}
        </code>
      </div>
      <div className="transcript-entry__copy">
        {streaming ? (
          <StreamingText stopped={stopped}>{children}</StreamingText>
        ) : (
          children
        )}
      </div>
      {error ? (
        <Button
          iconStart={<Crop size={16} />}
          onClick={onRetry}
          size="small"
          type="button"
          variant="neutral"
        >
          Retry member
        </Button>
      ) : null}
    </article>
  )
}

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export function Composer({
  value,
  onChange,
  onSend,
  disabled = false,
}: ComposerProps) {
  return (
    <div className="redesign-composer">
      <InputField
        aria-label="Steer the debate"
        disabled={disabled}
        onChange={onChange}
        placeholder="Add evidence, challenge an assumption, or steer the next turn"
        prefix={<MessageCircle size={16} />}
        value={value}
      />
      <Button
        disabled={disabled || !value.trim()}
        onClick={onSend}
        size="small"
        type="button"
        variant="primary"
      >
        Interject
      </Button>
    </div>
  )
}

interface RunControlsProps {
  stopped?: boolean
  onRun?: () => void
  onSummary?: () => void
  onStop?: () => void
}

export function RunControls({
  stopped = false,
  onRun,
  onSummary,
  onStop,
}: RunControlsProps) {
  return (
    <div className="run-controls">
      <Button
        iconStart={<Play size={16} />}
        onClick={onRun}
        size="small"
        type="button"
        variant="primary"
      >
        Run round
      </Button>
      <Button
        iconStart={<Star size={16} />}
        onClick={onSummary}
        size="small"
        type="button"
        variant="neutral"
      >
        Ask Chair
      </Button>
      <Button
        iconStart={<MousePointer size={16} />}
        size="small"
        type="button"
        variant="subtle"
      >
        Moderator turn
      </Button>
      <Button
        iconStart={<X size={16} />}
        onClick={onStop}
        size="small"
        type="button"
        variant="subtle"
      >
        {stopped ? "Active turn stopped" : "Stop active member"}
      </Button>
    </div>
  )
}

interface CostMeterProps {
  expanded?: boolean
}

export function CostMeter({ expanded = false }: CostMeterProps) {
  return (
    <section className={`cost-meter ${expanded ? "is-expanded" : ""}`}>
      <div className="cost-meter__main">
        <div>
          <span className="section-kicker">Session cost</span>
          <strong>$0.0318</strong>
        </div>
        <Badge label="Exact" variant="success" />
      </div>
      <div className="cost-meter__bar">
        <span />
      </div>
      <div className="cost-meter__stats">
        <div>
          <span>Input</span>
          <code>1,482 tok · $0.0094</code>
        </div>
        <div>
          <span>Output</span>
          <code>1,359 tok · $0.0224</code>
        </div>
        <div>
          <span>Round limit</span>
          <code>$0.0800</code>
        </div>
      </div>
      {expanded ? (
        <div className="cost-meter__note">
          Provider usage is exact for Anthropic and OpenAI. Gemini fallback
          pricing is estimated from the override table.
        </div>
      ) : null}
    </section>
  )
}

interface PersonaEditorProps {
  member: Member
  removable?: boolean
  onDelete?: () => void
}

export function PersonaEditor({
  member,
  removable = true,
  onDelete,
}: PersonaEditorProps) {
  return (
    <section className={`persona-editor tone-${member.tone}`}>
      <div className="persona-editor__top">
        <InputField aria-label="Member name" value={member.name} />
        <Checkbox defaultChecked={member.chair} label="Chair" />
        <Tooltip content="Delete member">
          <IconButton
            aria-label={`Delete ${member.name}`}
            disabled={!removable}
            icon={<X size={16} />}
            onClick={onDelete}
            size="small"
            type="button"
            variant="subtle"
          />
        </Tooltip>
      </div>
      <div className="form-grid">
        <SelectField
          label="Provider"
          onChange={() => undefined}
          options={[
            { value: "Anthropic", label: "Anthropic" },
            { value: "OpenAI", label: "OpenAI" },
            { value: "Gemini", label: "Gemini" },
            { value: "OpenRouter", label: "OpenRouter" },
          ]}
          value={member.provider}
        />
        <InputField label="Model" value={member.model} />
      </div>
      <InputField label="Role and perspective" value={member.role} />
    </section>
  )
}

interface SettingsPanelProps {
  children: ReactNode
  section?: "runtime" | "members" | "prices"
  onSectionChange?: (section: "runtime" | "members" | "prices") => void
}

export function SettingsPanel({
  children,
  section = "runtime",
  onSectionChange,
}: SettingsPanelProps) {
  return (
    <section className="settings-panel">
      <div className="settings-panel__nav">
        {(["runtime", "members", "prices"] as const).map((item) => (
          <Button
            className={section === item ? "is-selected" : ""}
            key={item}
            onClick={() => onSectionChange?.(item)}
            size="small"
            type="button"
            variant="subtle"
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="settings-panel__body">{children}</div>
    </section>
  )
}

interface KeyFieldProps {
  name: string
  environment: string
  invalid?: boolean
}

export function KeyField({
  name,
  environment,
  invalid = false,
}: KeyFieldProps) {
  const [value, setValue] = useState(invalid ? "sk-invalid" : "")
  const [testing, setTesting] = useState(false)
  return (
    <section className={`key-field ${invalid ? "is-invalid" : ""}`}>
      <div className="key-field__label">
        <div>
          <strong>{name}</strong>
          <code>{environment}</code>
        </div>
        <Badge
          label={invalid ? "Invalid" : value ? "Entered" : "Not set"}
          variant={invalid ? "danger" : value ? "brand" : "secondary"}
        />
      </div>
      <div className="key-field__controls">
        <InputField
          aria-invalid={invalid}
          aria-label={`${name} API key`}
          onChange={setValue}
          placeholder="Paste key"
          type="password"
          value={value}
        />
        <Button
          disabled={!value}
          iconStart={
            testing ? (
              <Crop className="spin" size={16} />
            ) : (
              <Settings size={16} />
            )
          }
          onClick={() => {
            setTesting(true)
            window.setTimeout(() => setTesting(false), 700)
          }}
          size="small"
          type="button"
          variant="neutral"
        >
          {testing ? "Testing" : "Test"}
        </Button>
        <IconButton
          aria-label={`Remove ${name} key`}
          icon={<X size={16} />}
          onClick={() => setValue("")}
          size="small"
          type="button"
          variant="subtle"
        />
      </div>
      {invalid ? (
        <p>Authentication failed. Replace this key before the next round.</p>
      ) : null}
    </section>
  )
}

export function PriceTable() {
  const rows = [
    ["claude-sonnet-5-5", "3.00", "15.00", "Exact"],
    ["gpt-4o", "2.50", "10.00", "Exact"],
    ["gemini-2.5-flash", "0.15", "0.60", "Estimated"],
    ["openrouter/default", "1.50", "6.00", "Estimated"],
  ]
  return (
    <section className="price-table-redesign">
      <div className="data-row data-row--header">
        <span>Model</span>
        <span>Input / 1M</span>
        <span>Output / 1M</span>
        <span>Usage</span>
      </div>
      {rows.map(([model, input, output, usage]) => (
        <div className="data-row" key={model}>
          <code>{model}</code>
          <InputField aria-label={`${model} input price`} value={input} />
          <InputField aria-label={`${model} output price`} value={output} />
          <Badge
            label={usage}
            variant={usage === "Exact" ? "success" : "warning"}
          />
        </div>
      ))}
    </section>
  )
}

interface SessionHistoryProps {
  onOpen?: () => void
}

export function SessionHistory({ onOpen }: SessionHistoryProps) {
  const [query, setQuery] = useState("")
  const sessions = [
    [topic, "Today, 10:42", "Skeptic · Builder · Visionary · Chair", "$0.0318"],
    [
      "Should agent swarms replace workflow engines?",
      "Yesterday, 18:14",
      "Builder · Skeptic · Chair",
      "$0.0472",
    ],
    [
      "Is Rust worth the delivery cost for an early-stage product?",
      "Oct 18, 09:20",
      "Visionary · Builder · Chair",
      "$0.0116",
    ],
  ]
  const visible = useMemo(
    () =>
      sessions.filter(([sessionTopic]) =>
        sessionTopic.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )
  return (
    <section className="session-history">
      <div className="session-history__search">
        <InputField
          aria-label="Search sessions"
          onChange={setQuery}
          placeholder="Search topics"
          prefix={<Search size={16} />}
          value={query}
        />
        <SelectField
          onChange={() => undefined}
          options={[
            { value: "recent", label: "Most recent" },
            { value: "cost", label: "Highest cost" },
          ]}
          value="recent"
        />
      </div>
      <div className="session-history__list">
        {visible.map(([sessionTopic, date, people, cost], index) => (
          <article className="session-row" key={sessionTopic}>
            <div className="session-row__index">
              <code>{String(index + 1).padStart(2, "0")}</code>
            </div>
            <div>
              <strong>{sessionTopic}</strong>
              <p>{people}</p>
            </div>
            <div className="session-row__meta">
              <span>{date}</span>
              <code>{cost}</code>
            </div>
            <Button
              iconEnd={<MousePointer size={16} />}
              onClick={onOpen}
              size="small"
              type="button"
              variant="neutral"
            >
              Reopen
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}

interface ConfirmDialogProps {
  onCancel?: () => void
  onConfirm?: () => void
}

export function ConfirmDialog({ onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="confirm-scrim">
      <section
        aria-label="Delete member confirmation"
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <div className="confirm-dialog__icon">
          <X size={20} />
        </div>
        <div className="screen-title">Delete Builder?</div>
        <p>
          This removes the persona from the council. Existing transcript entries
          remain in saved sessions.
        </p>
        <ButtonGroup align="end">
          <Button onClick={onCancel} type="button" variant="neutral">
            Keep member
          </Button>
          <Button onClick={onConfirm} type="button" variant="primary">
            Delete member
          </Button>
        </ButtonGroup>
      </section>
    </div>
  )
}

interface ToastProps {
  message: string
  status?: "default" | "success" | "warning" | "error"
}

export function Toast({ message, status = "default" }: ToastProps) {
  return (
    <div className={`inline-toast is-${status}`} role="status">
      <span className="identity-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

interface DebateStageProps {
  direction: Direction
  state: DemoState
  onStateChange?: (state: DemoState) => void
}

export function DebateStage({
  direction,
  state,
  onStateChange,
}: DebateStageProps) {
  const [message, setMessage] = useState("")
  const [muted, setMuted] = useState(state === "muted")
  const isLong = state === "long"
  const active = councilMembers[2]
  const failed = councilMembers[1]

  if (state === "first-run") {
    return (
      <section className="first-run-redesign">
        <div className="first-run-redesign__mark">
          <Home size={28} />
        </div>
        <span className="section-kicker">A local room for hard questions</span>
        <div className="display-title">
          Build the council before the first round.
        </div>
        <p>
          Add one provider key, review the four default perspectives, then start
          with a question that benefits from disagreement.
        </p>
        <div className="first-run-redesign__steps">
          <div>
            <code>01</code>
            <span>Add provider keys</span>
          </div>
          <div>
            <code>02</code>
            <span>Review personas</span>
          </div>
          <div>
            <code>03</code>
            <span>Open the debate</span>
          </div>
        </div>
        <ButtonGroup align="center">
          <Button
            iconStart={<Settings size={16} />}
            type="button"
            variant="neutral"
          >
            Add keys
          </Button>
          <Button
            iconStart={<Play size={16} />}
            type="button"
            variant="primary"
          >
            New debate
          </Button>
        </ButtonGroup>
      </section>
    )
  }

  const transcriptContent = (
    <div className="direction-transcript">
      <TranscriptEntry label="You" user>
        {isLong ? topic : "Should teams prefer a modular monolith by default?"}
      </TranscriptEntry>
      <TranscriptEntry member={councilMembers[0]}>
        The default should reduce coordination cost without pretending
        boundaries enforce themselves. A monolith is safe only when module
        ownership is visible and tested.
      </TranscriptEntry>
      {state === "failed" ? (
        <TranscriptEntry
          error
          member={failed}
          onRetry={() => onStateChange?.("streaming")}
        >
          The provider stopped before returning a response. The round continued
          with the remaining members.
        </TranscriptEntry>
      ) : (
        <TranscriptEntry member={failed}>
          Begin with one deployable, define extraction criteria, and move a
          boundary only when independent scaling or release cadence is real.
        </TranscriptEntry>
      )}
      <TranscriptEntry
        member={active}
        stopped={state === "stopped"}
        streaming={state === "streaming" || state === "stopped" || isLong}
      >
        {isLong
          ? longResponse
          : state === "stopped"
            ? "The active generation was cancelled. Earlier members remain complete."
            : "The durable default is an architecture designed for reversible extraction, with event seams and clear data ownership while retaining"}
      </TranscriptEntry>
    </div>
  )

  const cards = councilMembers.map((member) => (
    <MemberCard
      active={member.id === active.id && state !== "stopped"}
      failed={member.id === failed.id && state === "failed"}
      key={member.id}
      member={member}
      muted={member.id === "skeptic" && muted}
      onMute={
        member.id === "skeptic" ? () => setMuted((value) => !value) : undefined
      }
      skipped={member.id === "skeptic" && muted}
    />
  ))

  return (
    <section className={`debate-stage debate-stage--${direction}`}>
      {state === "missing-key" ? (
        <div className="key-alert">
          <Settings size={16} />
          <span>Anthropic key is missing. Skeptic and Chair cannot run.</span>
          <Button size="small" type="button" variant="neutral">
            Manage keys
          </Button>
        </div>
      ) : null}

      {direction === "thread" ? (
        <>
          <div className="thread-topic">
            <span className="section-kicker">Round 2 of 3 · Live</span>
            <div className="screen-title">
              {isLong ? topic : "Modular monolith or microservices?"}
            </div>
            <div className="thread-members">{cards}</div>
          </div>
          {transcriptContent}
        </>
      ) : null}

      {direction === "arena" ? (
        <>
          <div className="arena-board">
            <div className="arena-topic">
              <span className="section-kicker">Question under debate</span>
              <div>
                {isLong ? topic : "What should be the default architecture?"}
              </div>
              <code>ROUND 02 · SPEAKER 03</code>
            </div>
            <div className="arena-members">{cards}</div>
          </div>
          <div className="arena-live">{transcriptContent}</div>
        </>
      ) : null}

      {direction === "workbench" ? (
        <div className="workbench-grid">
          <section className="workbench-panel workbench-roster">
            <div className="panel-label">Council</div>
            {cards}
          </section>
          <section className="workbench-panel workbench-transcript">
            <div className="panel-label">Transcript · Round 2</div>
            {transcriptContent}
          </section>
          <section className="workbench-panel workbench-inspector">
            <div className="panel-label">Live inspector</div>
            <MemberCard active member={active} />
            <div className="inspector-data">
              <span>Started</span>
              <code>10:42:18</code>
              <span>Latency</span>
              <code>2.7s</code>
              <span>Output</span>
              <code>151 tok</code>
              <span>Cost</span>
              <code>$0.0012</code>
            </div>
            <CostMeter />
          </section>
        </div>
      ) : null}

      <div className="debate-dock">
        <Composer
          disabled={state === "stopped"}
          onChange={setMessage}
          onSend={() => setMessage("")}
          value={message}
        />
        <RunControls
          onRun={() => onStateChange?.("streaming")}
          onStop={() => onStateChange?.("stopped")}
          stopped={state === "stopped"}
        />
        {state === "muted" || muted ? (
          <Toast
            message="Skeptic is muted and will be skipped next round."
            status="warning"
          />
        ) : null}
      </div>
      {state === "confirm" ? (
        <ConfirmDialog onCancel={() => onStateChange?.("streaming")} />
      ) : null}
    </section>
  )
}

export function NewDebateFrame() {
  const [prompt, setPrompt] = useState("")
  return (
    <section className="product-frame product-frame--new">
      <div className="frame-heading">
        <span className="section-kicker">New debate</span>
        <div className="display-title">
          Give the council a question with real tension.
        </div>
        <p>
          Clear questions produce clearer disagreement. You can steer later.
        </p>
      </div>
      <TextareaField
        label="Topic or question"
        onChange={setPrompt}
        placeholder="What should the council reason through?"
        rows={6}
        value={prompt}
      />
      <div className="suggestion-grid">
        {[
          "Should we split the monolith this year?",
          "When is a rewrite the responsible choice?",
          "Should product teams own infrastructure?",
        ].map((suggestion) => (
          <Button
            key={suggestion}
            onClick={() => setPrompt(suggestion)}
            size="small"
            type="button"
            variant="neutral"
          >
            {suggestion}
          </Button>
        ))}
      </div>
      <div className="form-grid">
        <SelectField
          label="Words per turn"
          onChange={() => undefined}
          options={[
            { value: "80", label: "80 · concise" },
            { value: "120", label: "120 · balanced" },
            { value: "200", label: "200 · detailed" },
          ]}
          value="120"
        />
        <SelectField
          label="Rounds"
          onChange={() => undefined}
          options={[
            { value: "1", label: "1 round" },
            { value: "2", label: "2 rounds" },
            { value: "3", label: "3 rounds" },
          ]}
          value="2"
        />
      </div>
      <ButtonGroup align="end">
        <Button type="button" variant="neutral">
          Save draft
        </Button>
        <Button
          disabled={!prompt}
          iconStart={<Play size={16} />}
          type="button"
          variant="primary"
        >
          Open debate
        </Button>
      </ButtonGroup>
    </section>
  )
}

export function SettingsFrame({ confirm = false }: { confirm?: boolean }) {
  const [section, setSection] = useState<"runtime" | "members" | "prices">(
    "members",
  )
  const [showConfirm, setShowConfirm] = useState(confirm)
  return (
    <section className="product-frame">
      <div className="frame-heading frame-heading--row">
        <div>
          <span className="section-kicker">Configuration</span>
          <div className="screen-title">Council settings</div>
        </div>
        <Button
          iconStart={<Upload size={16} />}
          type="button"
          variant="primary"
        >
          Save changes
        </Button>
      </div>
      <SettingsPanel onSectionChange={setSection} section={section}>
        {section === "members" ? (
          <div className="editor-stack">
            {councilMembers.map((member, index) => (
              <PersonaEditor
                key={member.id}
                member={member}
                onDelete={index === 1 ? () => setShowConfirm(true) : undefined}
              />
            ))}
          </div>
        ) : null}
        {section === "runtime" ? (
          <div className="editor-stack">
            <div className="form-grid">
              <SelectField
                label="Words per turn"
                onChange={() => undefined}
                options={[{ value: "120", label: "120 words" }]}
                value="120"
              />
              <InputField label="Prompt window" suffix="entries" value="40" />
            </div>
            <TextareaField
              label="System constraints"
              rows={5}
              value="Respond by name, add a new argument each turn, and state uncertainty plainly."
            />
            <SwitchField
              defaultSelected
              description="Continue remaining members if one provider fails."
              label="Continue rounds after errors"
            />
          </div>
        ) : null}
        {section === "prices" ? <PriceTable /> : null}
      </SettingsPanel>
      {showConfirm ? (
        <ConfirmDialog onCancel={() => setShowConfirm(false)} />
      ) : null}
    </section>
  )
}

export function KeysFrame({ invalid = false }: { invalid?: boolean }) {
  return (
    <section className="product-frame">
      <div className="frame-heading">
        <span className="section-kicker">Provider access</span>
        <div className="screen-title">API keys</div>
        <p>
          Values are held locally. Test each provider before starting a round.
        </p>
      </div>
      <div className="key-stack">
        <KeyField
          environment="ANTHROPIC_API_KEY"
          invalid={invalid}
          name="Anthropic"
        />
        <KeyField environment="OPENAI_API_KEY" name="OpenAI" />
        <KeyField environment="GEMINI_API_KEY" name="Google Gemini" />
        <KeyField environment="OPENROUTER_API_KEY" name="OpenRouter" />
      </div>
    </section>
  )
}

export function CostFrame() {
  return (
    <section className="product-frame">
      <div className="frame-heading">
        <span className="section-kicker">Usage and pricing</span>
        <div className="screen-title">Cost ledger</div>
        <p>
          Provider-reported usage is exact. Overrides fill gaps where usage is
          estimated.
        </p>
      </div>
      <CostMeter expanded />
      <PriceTable />
    </section>
  )
}

export function HistoryFrame() {
  return (
    <section className="product-frame">
      <div className="frame-heading">
        <span className="section-kicker">Saved reasoning</span>
        <div className="screen-title">Session history</div>
      </div>
      <SessionHistory />
    </section>
  )
}
