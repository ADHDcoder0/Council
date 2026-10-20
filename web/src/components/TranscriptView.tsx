import React, { useEffect, useRef } from "react";
import { marked } from "marked";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
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
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 transition-colors duration-150">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Topic Header banner */}
        {topic && (
          <div className="pb-4 mb-2 border-b border-subtle">
            <div className="flex items-center gap-2 font-mono text-[12px] leading-[16px] text-text-tertiary">
              <span className="text-text-tertiary">•</span>
              <span>Deliberation Transcript</span>
              {roundNumber > 1 && <span>· Round {roundNumber}</span>}
            </div>
            <h2 className="text-[18px] md:text-[20px] leading-[26px] md:leading-[28px] font-semibold text-text-primary mt-1 tracking-tight">
              {topic}
            </h2>
          </div>
        )}

        {/* Empty state: Setup checklist in list-row style */}
        {transcript.length === 0 ? (
          <div className="py-12 flex flex-col space-y-4">
            <div className="text-center max-w-md mx-auto mb-2">
              <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary">
                Deliberation Setup
              </h3>
              <p className="text-[13px] leading-[18px] text-text-secondary mt-1">
                Complete setup or select a topic to begin the debate.
              </p>
            </div>

            <div className="space-y-2">
              {/* Checklist Row 1: Add API keys */}
              <button
                onClick={onOpenKeys}
                className="w-full text-left group rounded-[12px] p-4 bg-surface-2 border border-subtle hover:border-strong transition-colors duration-150 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-pill bg-surface-3 flex items-center justify-center text-text-secondary">
                    <Icon name="key-round" size={16} />
                  </div>
                  <div>
                    <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                      1. Add provider API keys
                    </h4>
                    <p className="text-[13px] leading-[18px] text-text-secondary">
                      Anthropic, OpenAI, Gemini, or OpenRouter keys stored locally
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill variant="neutral" label="Required" showDot={false} />
                  <span className="text-text-tertiary group-hover:translate-x-0.5 transition-transform duration-150">
                    <Icon name="chevron-right" size={16} />
                  </span>
                </div>
              </button>

              {/* Checklist Row 2: Review members */}
              <div className="rounded-[12px] p-4 bg-surface-2 border border-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-pill bg-surface-3 flex items-center justify-center text-text-secondary">
                    <Icon name="settings" size={16} />
                  </div>
                  <div>
                    <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                      2. Review council personas
                    </h4>
                    <p className="text-[13px] leading-[18px] text-text-secondary">
                      Skeptic, Builder, Visionary, and Chair ready
                    </p>
                  </div>
                </div>
                <StatusPill variant="success" label="Configured" />
              </div>

              {/* Checklist Row 3: Start a debate */}
              <button
                onClick={onNewDebate}
                className="w-full text-left group rounded-[12px] p-4 bg-surface-2 border border-subtle hover:border-strong transition-colors duration-150 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-pill bg-surface-3 flex items-center justify-center text-text-secondary">
                    <Icon name="play" size={16} />
                  </div>
                  <div>
                    <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                      3. Start a debate
                    </h4>
                    <p className="text-[13px] leading-[18px] text-text-secondary">
                      Enter a question or choose from suggested topics
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill variant="success" label="Ready" />
                  <span className="text-text-tertiary group-hover:translate-x-0.5 transition-transform duration-150">
                    <Icon name="chevron-right" size={16} />
                  </span>
                </div>
              </button>
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
                  className="rounded-[12px] p-4 bg-surface-2 border border-subtle border-l-2 border-l-accent-danger space-y-2.5 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-subtle">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-danger" />
                      <strong className="text-[14px] leading-[20px] font-semibold text-text-primary">
                        {entry.speaker}
                      </strong>
                      <StatusPill variant="danger" label="Failed" />
                    </div>
                    {onRetrySpeaker && (
                      <button
                        onClick={() => onRetrySpeaker(entry.speaker)}
                        className="text-text-secondary hover:text-text-primary hover:bg-surface-3 px-2.5 py-1 rounded-pill text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors duration-150"
                        title="Retry this speaker's turn"
                      >
                        <Icon name="rotate-ccw" size={12} />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                  <div className="text-accent-danger font-mono text-[12px] leading-[18px] break-words">
                    {entry.text}
                  </div>
                </article>
              );
            }

            return (
              <article
                key={entry.id || idx}
                style={{
                  borderLeftColor: isUser ? "var(--member-user)" : toneColor,
                  borderLeftWidth: "2px",
                }}
                className={`rounded-[12px] p-4 border border-subtle transition-colors duration-150 ${
                  isUser ? "bg-surface-3" : "bg-surface-2"
                } ${entry.is_streaming ? "ring-1 ring-border-strong" : ""}`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-subtle">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isUser ? "var(--member-user)" : toneColor }}
                      aria-hidden="true"
                    />
                    <strong className="text-[14px] leading-[20px] font-semibold text-text-primary truncate">
                      {isUser ? "You" : entry.speaker}
                    </strong>

                    {entry.is_chair && (
                      <StatusPill variant="warning" label="Synthesis" showDot={false} />
                    )}

                    {entry.is_streaming && (
                      <StatusPill variant="success" label="Streaming" />
                    )}

                    {entry.round && !isUser && (
                      <span className="text-[12px] font-mono text-text-tertiary">
                        R{entry.round}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[12px] leading-[16px] font-mono text-text-tertiary shrink-0">
                    {/* Never show token count beside You */}
                    {!isUser && entry.output_tokens !== undefined && entry.output_tokens > 0 && (
                      <span>
                        {entry.input_tokens || 0} in · {entry.output_tokens} out
                      </span>
                    )}
                    {entry.timestamp && <span>{entry.timestamp}</span>}
                  </div>
                </div>

                {/* Entry Text / Prose: 15/24 transcript reading body text */}
                <div className="prose-transcript text-[15px] leading-[24px] text-text-primary">
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
