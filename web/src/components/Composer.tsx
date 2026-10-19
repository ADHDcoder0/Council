import React, { useState, KeyboardEvent } from "react";
import { Play, Sparkles, Compass, Square, Send, Bookmark } from "lucide-react";

interface ComposerProps {
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onRunRound: (rounds: number) => void;
  onRunSummary: () => void;
  onRunModerator: () => void;
  onStop: () => void;
  onSave: () => void;
  hasChair: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  isStreaming,
  onSendMessage,
  onRunRound,
  onRunSummary,
  onRunModerator,
  onStop,
  onSave,
  hasChair,
}) => {
  const [inputText, setInputText] = useState("");
  const [roundsCount, setRoundsCount] = useState(1);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[var(--council-border)] bg-[var(--council-surface-1)] p-3 md:p-4 shrink-0 transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col space-y-3">
        {/* Input box */}
        <div className="relative flex items-end bg-[var(--council-canvas)] border border-[var(--council-border)] rounded-lg p-2 focus-within:border-[var(--council-accent)] transition">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Steer the council or add a counterargument…  Ctrl + Enter to send"
            rows={2}
            className="w-full bg-transparent text-xs text-[var(--council-text)] placeholder-[var(--council-text-faint)] focus:outline-none resize-none px-2 py-1 max-h-28"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isStreaming}
            className="ml-2 px-3 py-1.5 rounded-md bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] disabled:opacity-40 text-[var(--council-text)] text-xs font-medium transition flex items-center space-x-1 shrink-0"
            title="Inject message into transcript"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Interject</span>
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Rounds Selector & Run Round */}
            <div className="inline-flex rounded-md border border-[var(--council-border)] bg-[var(--council-surface-2)] overflow-hidden shadow-sm">
              <button
                onClick={() => onRunRound(roundsCount)}
                disabled={isStreaming}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--council-accent)] hover:opacity-90 disabled:opacity-50 text-[var(--bg-canvas)] text-xs font-semibold transition"
                title={`Run ${roundsCount} debate round(s)`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isStreaming ? "Running…" : "Run round"}</span>
              </button>
              <select
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value))}
                disabled={isStreaming}
                className="bg-[var(--council-surface-2)] text-[var(--council-text)] text-xs px-2 py-1.5 border-l border-[var(--council-border)] focus:outline-none cursor-pointer"
                title="Number of rounds"
              >
                <option value={1}>1 round</option>
                <option value={2}>2 rounds</option>
                <option value={3}>3 rounds</option>
                <option value={5}>5 rounds</option>
              </select>
            </div>

            {/* Run Chair Summary */}
            {hasChair && (
              <button
                onClick={onRunSummary}
                disabled={isStreaming}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] disabled:opacity-50 text-[var(--council-text)] text-xs font-medium transition"
                title="Ask the chair for a synthesized summary"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--council-warning)]" />
                <span>Ask Chair</span>
              </button>
            )}

            {/* Moderator Turn */}
            <button
              onClick={onRunModerator}
              disabled={isStreaming}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] disabled:opacity-50 text-[var(--council-text)] text-xs font-medium transition"
              title="Let the moderator dynamically choose the next speaker"
            >
              <Compass className="w-3.5 h-3.5 text-[var(--council-accent)]" />
              <span>Moderator turn</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Stop Active Member button */}
            {isStreaming && (
              <button
                onClick={onStop}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition animate-pulse"
                title="Cancel ongoing completion"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop member</span>
              </button>
            )}

            {/* Save Session */}
            <button
              onClick={onSave}
              disabled={isStreaming}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] disabled:opacity-50 text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs font-medium transition"
              title="Save markdown to ~/council-sessions/"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
