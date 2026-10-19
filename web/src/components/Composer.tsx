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
    <div className="border-t border-zinc-800 bg-zinc-900/80 p-3 md:p-4 shrink-0">
      <div className="flex flex-col space-y-3">
        {/* Input box */}
        <div className="relative flex items-end bg-zinc-950 border border-zinc-800 rounded-xl p-2 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message, counterargument, or steering prompt... (Ctrl+Enter to send)"
            rows={2}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-2 py-1 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isStreaming}
            className="ml-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition shrink-0"
            title="Inject message into transcript"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {/* Rounds Selector & Run Round */}
            <div className="inline-flex rounded-lg shadow-sm border border-zinc-700 bg-zinc-800">
              <button
                onClick={() => onRunRound(roundsCount)}
                disabled={isStreaming}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-l-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                title={`Run ${roundsCount} debate round(s)`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Round</span>
              </button>
              <select
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value))}
                disabled={isStreaming}
                className="bg-zinc-800 text-zinc-200 text-xs px-2 py-1.5 rounded-r-lg border-l border-zinc-700 focus:outline-none cursor-pointer"
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-700/60 bg-amber-950/40 hover:bg-amber-900/50 disabled:opacity-50 text-amber-300 text-xs font-medium transition"
                title="Ask the chair for a synthesized summary"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summary</span>
              </button>
            )}

            {/* Moderator Turn */}
            <button
              onClick={onRunModerator}
              disabled={isStreaming}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium transition"
              title="Let the moderator pick the next speaker dynamically (up to 12 turns)"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Moderator Turn</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Stop / Cancel Stream button */}
            {isStreaming && (
              <button
                onClick={onStop}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition animate-pulse"
                title="Cancel ongoing completion"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            )}

            {/* Save Session */}
            <button
              onClick={onSave}
              disabled={isStreaming}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium transition"
              title="Save markdown to ~/council-sessions/"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
