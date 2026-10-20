import React from "react";
import { StatusPill } from "./StatusPill";

interface CostFooterProps {
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  isCostEstimated: boolean;
  isStreaming: boolean;
  activeSpeaker: string | null;
}

export const CostFooter: React.FC<CostFooterProps> = ({
  inputTokens,
  outputTokens,
  totalCostUsd,
  isCostEstimated,
  isStreaming,
  activeSpeaker,
}) => {
  return (
    <footer className="h-9 border-t border-subtle bg-surface-1 px-4 md:px-6 flex items-center justify-between text-[12px] leading-[16px] font-mono text-text-tertiary select-none shrink-0 transition-colors duration-150">
      {/* Left: Tokens in and out, cost, StatusPill Exact or Estimated */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span>{inputTokens.toLocaleString()} in</span>
          <span className="text-text-tertiary">·</span>
          <span>{outputTokens.toLocaleString()} out</span>
        </div>

        <span className="text-border-strong">|</span>

        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">
            ${totalCostUsd.toFixed(4)}
          </span>
          <StatusPill
            variant={isCostEstimated ? "warning" : "success"}
            label={isCostEstimated ? "ESTIMATED" : "EXACT"}
            title={
              isCostEstimated
                ? "Usage estimated (~1.3 tok/word fallback)"
                : "Exact tokens reported by provider API"
            }
          />
        </div>
      </div>

      {/* Right: Runtime status / host */}
      <div className="flex items-center gap-2 text-text-tertiary">
        {isStreaming ? (
          <span className="text-accent-success font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
            <span>{activeSpeaker ? `${activeSpeaker} speaking…` : "Deliberating…"}</span>
          </span>
        ) : (
          <span>127.0.0.1 · Ready</span>
        )}
      </div>
    </footer>
  );
};
