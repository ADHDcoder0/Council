import { Badge, Button, Crop, X } from "@figma/astraui"
import type { CouncilMember, TranscriptEntry } from "@/types/council"

interface TranscriptBlockProps {
  entry: TranscriptEntry
  member?: CouncilMember
  onRetry?: () => void
}

export default function TranscriptBlock({
  entry,
  member,
  onRetry,
}: TranscriptBlockProps) {
  const tone = member?.tone ?? (entry.kind === "user" ? "user" : "chair")

  return (
    <article
      className={`transcript-block member-${tone} transcript-block--${entry.kind}`}
    >
      <div className="transcript-block__header">
        <div className="transcript-block__identity">
          <span className="member-dot" aria-hidden="true" />
          <strong>{entry.label}</strong>
          {entry.kind === "chair" ? (
            <Badge label="Synthesis" variant="warning" />
          ) : null}
          {entry.streaming ? (
            <Badge label="Generating" variant="brand" />
          ) : null}
          {entry.kind === "error" ? (
            <Badge label="Failed" variant="danger" />
          ) : null}
        </div>
        {entry.model ? (
          <div className="transcript-block__model">
            <span>{entry.provider}</span>
            <code>{entry.model}</code>
          </div>
        ) : null}
      </div>
      <div className="transcript-block__copy">
        {entry.kind === "error" ? <X aria-hidden="true" size={18} /> : null}
        <p>{entry.text}</p>
        {entry.streaming ? (
          <span className="stream-cursor" aria-hidden="true" />
        ) : null}
      </div>
      {entry.kind === "error" ? (
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
      {entry.time ? (
        <div className="transcript-block__meta">
          <span>{entry.time}</span>
          <span>{entry.tokens}</span>
          <span>{entry.cost}</span>
        </div>
      ) : null}
    </article>
  )
}
