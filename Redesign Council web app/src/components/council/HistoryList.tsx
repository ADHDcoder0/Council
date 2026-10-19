import { Badge, Button, InputField, MousePointer, Search } from "@figma/astraui"
import { useMemo, useState } from "react"
import type { HistoryEntry } from "@/types/council"

interface HistoryListProps {
  entries: HistoryEntry[]
  onOpen: (entry: HistoryEntry) => void
}

export default function HistoryList({ entries, onOpen }: HistoryListProps) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "")
  const filtered = useMemo(
    () =>
      entries.filter((entry) =>
        entry.topic.toLowerCase().includes(query.toLowerCase()),
      ),
    [entries, query],
  )

  return (
    <section className="history-view">
      <div className="view-header">
        <div>
          <div className="view-title">Debate history</div>
          <p>{entries.length} sessions stored in this prototype workspace.</p>
        </div>
        <InputField
          aria-label="Search debate history"
          className="history-search"
          onChange={setQuery}
          placeholder="Search topics"
          prefix={<Search size={16} />}
          value={query}
        />
      </div>
      {filtered.length ? (
        <div className="history-list">
          {filtered.map((entry) => (
            <div
              className={`history-row ${
                selectedId === entry.id ? "is-selected" : ""
              }`}
              key={entry.id}
              onClick={() => setSelectedId(entry.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedId(entry.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="history-row__main">
                <div className="history-row__topic">{entry.topic}</div>
                <div className="history-row__members">
                  {entry.members.join(" · ")}
                </div>
              </div>
              <div className="history-row__meta">
                <code>{entry.id}</code>
                <span>{entry.relativeTime}</span>
                <span>{entry.rounds} rounds</span>
                <span>{entry.tokens} tok</span>
                <span>{entry.cost}</span>
                <Badge
                  label={entry.status}
                  variant={
                    entry.status === "Complete"
                      ? "success"
                      : entry.status === "Failed"
                        ? "danger"
                        : "warning"
                  }
                />
              </div>
              <Button
                iconEnd={<MousePointer size={16} />}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen(entry)
                }}
                size="small"
                type="button"
                variant="neutral"
              >
                Open
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-filter">
          <Search aria-hidden="true" size={24} />
          <div>No matching debates</div>
          <p>Try a broader topic or clear the search.</p>
          <Button onClick={() => setQuery("")} type="button" variant="neutral">
            Clear search
          </Button>
        </div>
      )}
    </section>
  )
}
