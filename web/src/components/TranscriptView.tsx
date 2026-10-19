import React, { useEffect, useRef } from "react";
import { AlertCircle, RotateCcw, Crown, Sparkles, User, Terminal } from "lucide-react";
import { marked } from "marked";
import { TranscriptEntry, getMemberTone } from "../types";

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
  topic: string;
  roundNumber?: number;
  onRetrySpeaker?: (speaker: string) => void;
  onOpenKeys?: () => void;
  onNewDebate?: () => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  topic,
  roundNumber = 1,
  onRetrySpeaker,
  onOpenKeys,
  onNewDebate,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entries or streaming tokens
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const renderContent = (text: string) => {
    try {
      return { __html: marked.parse(text) };
    } catch {
      return { __html: text };
    }
  };

  const getToneColor = (speaker: string, isChair = false) => {
    const tone = getMemberTone(speaker, isChair);
    switch (tone) {
      case "chair":
        return "var(--member-chair)";
      case "skeptic":
        return "var(--member-skeptic)";
      case "builder":
        return "var(--member-builder)";
      case "visionary":
        return "var(--member-visionary)";
      case "user":
        return "var(--member-user)";
      default:
        return "var(--member-builder)";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 transition-colors">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Topic Header banner */}
        {topic && (
          <div className="pb-4 mb-4 border-b border-[var(--council-border)]">
            <div className="flex items-center space-x-2 font-mono text-[11px] uppercase tracking-wider text-[var(--council-text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--council-accent)]" />
              <span>Deliberation Thread · Round {roundNumber}</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold mt-1 text-[var(--council-text)] tracking-tight">
              {topic}
            </h1>
          </div>
        )}

        {transcript.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-8 bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded-xl my-6">
            <div className="w-12 h-12 rounded-full bg-[var(--council-surface-2)] border border-[var(--council-border-strong)] flex items-center justify-center text-[var(--council-accent)] mb-4">
              <Terminal className="w-6 h-6" />
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--council-text-muted)]">
              A local room for hard questions
            </span>
            <h2 className="text-lg font-semibold text-[var(--council-text)] mt-1 mb-2">
              Build the council before the first round.
            </h2>
            <p className="text-xs text-[var(--council-text-muted)] max-w-md leading-relaxed mb-6">
              Add at least one provider key, review the personas, then start with a question that benefits from structured disagreement.
            </p>

            {/* 3 Step Roadmap */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg mb-6 border-t border-b border-[var(--council-border)] py-3 text-left">
              <div className="px-3 py-1">
                <code className="text-[10px] text-[var(--council-accent)] font-semibold">01</code>
                <div className="text-xs font-medium text-[var(--council-text)]">Add provider keys</div>
              </div>
              <div className="px-3 py-1 border-t sm:border-t-0 sm:border-l border-[var(--council-border)]">
                <code className="text-[10px] text-[var(--council-accent)] font-semibold">02</code>
                <div className="text-xs font-medium text-[var(--council-text)]">Review personas</div>
              </div>
              <div className="px-3 py-1 border-t sm:border-t-0 sm:border-l border-[var(--council-border)]">
                <code className="text-[10px] text-[var(--council-accent)] font-semibold">03</code>
                <div className="text-xs font-medium text-[var(--council-text)]">Open the debate</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenKeys && (
                <button
                  onClick={onOpenKeys}
                  className="px-3 py-1.5 rounded-lg bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-xs font-medium text-[var(--council-text)] transition"
                >
                  Configure keys
                </button>
              )}
              {onNewDebate && (
                <button
                  onClick={onNewDebate}
                  className="px-3 py-1.5 rounded-lg bg-[var(--council-accent)] hover:opacity-90 text-[var(--bg-canvas)] text-xs font-semibold transition"
                >
                  Start debate
                </button>
              )}
            </div>
          </div>
        ) : (
          transcript.map((entry, idx) => {
            const isUser =
              entry.speaker.toLowerCase() === "you" ||
              entry.speaker.toLowerCase() === "user";
            const toneColor = getToneColor(entry.speaker, entry.is_chair);

            if (entry.is_error) {
              return (
                <article
                  key={entry.id || idx}
                  className="rounded-lg p-4 bg-[var(--council-surface-1)] border border-[var(--council-border)] border-l-2 border-l-[var(--council-danger)] text-xs shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--council-border)]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--council-danger)]" />
                      <strong className="text-[var(--council-text)] font-semibold">
                        {entry.speaker}
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950/40 text-[var(--council-danger)] border border-red-800/40 font-mono">
                        Failed
                      </span>
                    </div>
                    <code className="text-[10px] text-[var(--council-text-faint)]">
                      error turn
                    </code>
                  </div>
                  <div className="text-[var(--council-danger)] font-mono text-[11px] leading-relaxed break-words">
                    {entry.text}
                  </div>
                  {onRetrySpeaker && (
                    <button
                      onClick={() => onRetrySpeaker(entry.speaker)}
                      className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text)] text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry member</span>
                    </button>
                  )}
                </article>
              );
            }

            return (
              <article
                key={entry.id || idx}
                style={{
                  borderLeftColor: toneColor,
                  borderLeftWidth: "2px",
                }}
                className={`rounded-lg p-4 bg-[var(--council-surface-1)] border border-[var(--council-border)] shadow-sm transition-all ${
                  entry.is_streaming ? "ring-1 ring-[var(--council-accent)]/50" : ""
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--council-border)]">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: toneColor }}
                      aria-hidden="true"
                    />
                    <strong className="text-xs font-semibold text-[var(--council-text)] truncate">
                      {isUser ? "You" : entry.speaker}
                    </strong>

                    {entry.is_chair && (
                      <span className="inline-flex items-center space-x-0.5 text-[10px] font-mono font-medium text-[var(--council-warning)] bg-[var(--council-surface-2)] border border-[var(--council-border)] px-1.5 py-0.2 rounded-full shrink-0">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        Synthesis
                      </span>
                    )}

                    {entry.is_streaming && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-[var(--council-accent)] bg-[var(--council-success-bg)] px-1.5 py-0.2 rounded-full shrink-0">
                        <span>Streaming</span>
                      </span>
                    )}

                    {entry.round && !isUser && (
                      <span className="text-[10px] font-mono text-[var(--council-text-faint)] shrink-0">
                        R{entry.round}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-[var(--council-text-faint)] font-mono shrink-0">
                    {entry.output_tokens !== undefined && entry.output_tokens > 0 && (
                      <span>
                        {entry.input_tokens || 0} in · {entry.output_tokens} out
                      </span>
                    )}
                    {entry.timestamp && <span>{entry.timestamp}</span>}
                  </div>
                </div>

                {/* Entry Text / Prose */}
                <div className="prose-transcript text-[var(--council-text)] leading-relaxed">
                  <div dangerouslySetInnerHTML={renderContent(entry.text || "...")} />
                  {entry.is_streaming && <span className="streaming-caret" />}
                </div>
              </article>
            );
          })
        )}
        <div ref={scrollEndRef} />
      </div>
    </div>
  );
};
