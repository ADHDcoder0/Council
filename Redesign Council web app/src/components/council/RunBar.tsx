import { Book, Button, Play, SelectField, Sliders, Wand2 } from "@figma/astraui"

interface RunBarProps {
  isRunning: boolean
  rounds: string
  onRoundsChange: (value: string) => void
  onRun: () => void
  onSummary: () => void
  onSave: () => void
}

export default function RunBar({
  isRunning,
  rounds,
  onRoundsChange,
  onRun,
  onSummary,
  onSave,
}: RunBarProps) {
  return (
    <div className="run-bar">
      <div className="run-bar__primary">
        <Button
          disabled={isRunning}
          iconStart={isRunning ? <Sliders size={16} /> : <Play size={16} />}
          onClick={onRun}
          size="small"
          type="button"
          variant="primary"
        >
          {isRunning ? "Running round…" : "Run round"}
        </Button>
        <SelectField
          aria-label="Number of rounds"
          className="run-bar__select"
          disabled={isRunning}
          onChange={onRoundsChange}
          options={[
            { value: "1", label: "1 round" },
            { value: "2", label: "2 rounds" },
            { value: "3", label: "3 rounds" },
          ]}
          value={rounds}
        />
        <Button
          disabled={isRunning}
          iconStart={<Wand2 size={16} />}
          onClick={onSummary}
          size="small"
          type="button"
          variant="neutral"
        >
          Summarize
        </Button>
        <Button
          disabled={isRunning}
          iconStart={<Sliders size={16} />}
          size="small"
          type="button"
          variant="subtle"
        >
          Moderator turn
        </Button>
      </div>
      <Button
        disabled={isRunning}
        iconStart={<Book size={16} />}
        onClick={onSave}
        size="small"
        type="button"
        variant="neutral"
      >
        Save session
      </Button>
    </div>
  )
}
