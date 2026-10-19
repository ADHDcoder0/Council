import React from "react";
import { Cpu, Terminal } from "lucide-react";

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
    <footer className="h-8 border-t border-[var(--council-border)] bg-[var(--council-surface-1)] px-4 flex items-center justify-between text-xs text-[var(--council-text-muted)] select-none shrink-0 transition-colors">
      <div className="flex items-center space-x-3 text-[11px] font-mono">
        {/* Token counts */}
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3 h-3 text-[var(--council-text-faint)]" />
          <span>
            {isCostEstimated ? "~" : ""}
            {inputTokens.toLocaleString()} in
          </span>
          <span className="text-[var(--council-text-faint)]">/</span>
          <span>
            {isCostEstimated ? "~" : ""}
            {outputTokens.toLocaleString()} out
          </span>
        </div>

        <span className="text-[var(--council-border-strong)]">|</span>

        {/* Cost & Accuracy Badge */}
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-[var(--council-text)]">
            ${totalCostUsd.toFixed(4)}
          </span>
          <span
            className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-medium ${
              isCostEstimated
                ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                : "bg-[var(--council-success-bg)] text-[var(--council-accent)] border border-[var(--council-accent)]/30"
            }`}
            title={
              isCostEstimated
                ? "Usage estimated (~1.3 tok/word fallback)"
                : "Exact tokens reported by provider API"
            }
          >
            {isCostEstimated ? "Estimated" : "Exact"}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-[11px]">
        {isStreaming ? (
          <div className="flex items-center space-x-1.5 text-[var(--council-accent)] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--council-accent)] animate-ping" />
            <span>{activeSpeaker ? `${activeSpeaker} speaking…` : "Deliberating…"}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-[var(--council-text-faint)] font-mono text-[10px]">
            <Terminal className="w-3 h-3" />
            <span>Local · 127.0.0.1</span>
          </div>
        )}
      </div>
    </footer>
  );
};
