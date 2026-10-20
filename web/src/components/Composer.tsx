import React, { useState, KeyboardEvent } from "react";
import { Icon } from "./Icon";

interface ComposerProps {
  isStreaming: boolean;
  activeSpeaker?: string | null;
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
  activeSpeaker,
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
    <div className="border-t border-subtle bg-surface-1 p-3 md:p-4 shrink-0 transition-colors duration-150 select-none">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {/* Progress line above the bar in caption style */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-[12px] leading-[16px] font-mono text-text-secondary animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
            <span>
              {activeSpeaker
                ? `${activeSpeaker} is responding…`
                : "Council is deliberating…"}
            </span>
          </div>
        )}

        {/* Composer box (16px radius, surface-1, hairline border, focus ring to border-strong) */}
        <div className="rounded-[16px] bg-surface-1 border border-subtle focus-within:border-strong p-3 flex flex-col gap-2 transition-colors duration-150">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Steer the council or add a counterargument…"
            rows={2}
            className="w-full bg-transparent text-[14px] leading-[20px] text-text-primary placeholder:text-text-tertiary focus:outline-none resize-none px-1 py-0.5 max-h-32"
          />

          <div className="flex items-center justify-between pt-1 border-t border-subtle/50">
            {/* Hint text in caption style: "Ctrl+Enter to send" */}
            <span className="text-[12px] leading-[16px] font-mono text-text-tertiary">
              Ctrl+Enter to send
            </span>

            {/* Send is a pill primary button inside composer bottom-right (40px height) */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              className="h-10 px-4 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-40 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5 shadow-none"
              title="Send message"
            >
              <Icon name="send" size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Run bar: Pill group (Run round / Stop, stepper, Summary, Moderator, Save) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Run round pill / Stop button */}
            {isStreaming ? (
              <button
                onClick={onStop}
                className="h-9 px-3.5 rounded-pill bg-accent-danger text-white hover:opacity-90 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5 shadow-none"
                title="Stop current speaker"
              >
                <Icon name="square" size={14} />
                <span>Stop</span>
              </button>
            ) : (
              <div className="inline-flex items-center rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover transition-colors duration-150 overflow-hidden">
                <button
                  onClick={() => onRunRound(roundsCount)}
                  className="h-9 pl-3.5 pr-2.5 text-[13px] leading-[18px] font-medium flex items-center gap-1.5"
                  title={`Run ${roundsCount} debate round(s)`}
                >
                  <Icon name="play" size={14} />
                  <span>Run round</span>
                </button>
                <select
                  value={roundsCount}
                  onChange={(e) => setRoundsCount(Number(e.target.value))}
                  className="h-9 pr-3 pl-1.5 bg-transparent text-[12px] leading-[16px] font-mono font-medium border-l border-black/15 focus:outline-none cursor-pointer"
                  title="Select rounds to run"
                >
                  <option value={1} className="bg-surface-2 text-text-primary">1</option>
                  <option value={2} className="bg-surface-2 text-text-primary">2</option>
                  <option value={3} className="bg-surface-2 text-text-primary">3</option>
                  <option value={5} className="bg-surface-2 text-text-primary">5</option>
                </select>
              </div>
            )}

            {/* Ghost pill for Summary */}
            {hasChair && (
              <button
                onClick={onRunSummary}
                disabled={isStreaming}
                className="h-9 px-3 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 disabled:opacity-40 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5"
                title="Synthesize debate summary"
              >
                <Icon name="file-text" size={16} />
                <span>Summary</span>
              </button>
            )}

            {/* Ghost pill for Moderator turn */}
            <button
              onClick={onRunModerator}
              disabled={isStreaming}
              className="h-9 px-3 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 disabled:opacity-40 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5"
              title="Let the moderator dynamically direct the debate"
            >
              <Icon name="compass" size={16} />
              <span>Moderator turn</span>
            </button>
          </div>

          {/* Secondary pill for Save session */}
          <button
            onClick={onSave}
            disabled={isStreaming}
            className="h-9 px-3 rounded-pill bg-btn-secondary-bg hover:bg-btn-secondary-hover border border-subtle text-text-secondary hover:text-text-primary disabled:opacity-40 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            title="Save markdown to ~/council-sessions/"
          >
            <Icon name="bookmark" size={16} />
            <span className="hidden sm:inline">Save session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
