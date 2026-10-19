import React, { useEffect, useRef } from "react";
import { Crown, User, AlertCircle, Bot } from "lucide-react";
import { marked } from "marked";
import { TranscriptEntry } from "../types";

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
  topic: string;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  topic,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entries or streaming tokens
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const getSpeakerStyle = (speaker: string, isChair = false) => {
    if (speaker.toLowerCase() === "you" || speaker.toLowerCase() === "user") {
      return {
        badge: "bg-indigo-950 text-indigo-300 border-indigo-800",
        border: "border-l-indigo-500",
        nameColor: "text-indigo-400",
        icon: <User className="w-3.5 h-3.5" />,
      };
    }
    if (isChair || speaker.toLowerCase().includes("chair")) {
      return {
        badge: "bg-amber-950 text-amber-300 border-amber-800",
        border: "border-l-amber-500",
        nameColor: "text-amber-400",
        icon: <Crown className="w-3.5 h-3.5" />,
      };
    }
    const lower = speaker.toLowerCase();
    if (lower.includes("skeptic")) {
      return {
        badge: "bg-red-950 text-red-300 border-red-800",
        border: "border-l-red-500",
        nameColor: "text-red-400",
        icon: <Bot className="w-3.5 h-3.5" />,
      };
    }
    if (lower.includes("builder")) {
      return {
        badge: "bg-emerald-950 text-emerald-300 border-emerald-800",
        border: "border-l-emerald-500",
        nameColor: "text-emerald-400",
        icon: <Bot className="w-3.5 h-3.5" />,
      };
    }
    if (lower.includes("visionary")) {
      return {
        badge: "bg-cyan-950 text-cyan-300 border-cyan-800",
        border: "border-l-cyan-500",
        nameColor: "text-cyan-400",
        icon: <Bot className="w-3.5 h-3.5" />,
      };
    }
    return {
      badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
      border: "border-l-indigo-400",
      nameColor: "text-indigo-300",
      icon: <Bot className="w-3.5 h-3.5" />,
    };
  };

  const renderContent = (text: string) => {
    try {
      return { __html: marked.parse(text) };
    } catch {
      return { __html: text };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {transcript.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
          <span className="text-4xl mb-3">🏛️</span>
          <h3 className="text-lg font-medium text-zinc-300 mb-1">
            Council Debate Ready
          </h3>
          <p className="text-sm max-w-sm mb-4">
            Type your topic or prompt below and click "Run Round" to let the council begin deliberating.
          </p>
        </div>
      ) : (
        transcript.map((entry, idx) => {
          const style = getSpeakerStyle(entry.speaker, entry.is_chair);

          if (entry.is_error) {
            return (
              <div
                key={entry.id || idx}
                className="rounded-lg p-4 bg-red-950/40 border border-red-800/80 text-red-200 flex items-start space-x-3 text-sm shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-red-300 mb-0.5">
                    {entry.speaker} encountered an error:
                  </div>
                  <div className="font-mono text-xs opacity-90">{entry.text}</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={entry.id || idx}
              className={`rounded-lg p-4 bg-zinc-900/90 border border-zinc-800/80 shadow-sm border-l-4 ${style.border} transition-all`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}
                  >
                    {style.icon}
                    <span>{entry.speaker}</span>
                  </span>

                  {entry.round && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      Round {entry.round}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                  {entry.output_tokens !== undefined && entry.output_tokens > 0 && (
                    <span title="Prompt and completion tokens">
                      {entry.input_tokens || 0} in / {entry.output_tokens} out
                    </span>
                  )}
                  {entry.timestamp && <span>{entry.timestamp}</span>}
                </div>
              </div>

              {/* Card Body */}
              <div
                className="prose-dark text-sm text-zinc-200 leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={renderContent(entry.text || "...")}
              />

              {/* Streaming typing cursor */}
              {entry.is_streaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
              )}
            </div>
          );
        })
      )}
      <div ref={scrollEndRef} />
    </div>
  );
};
