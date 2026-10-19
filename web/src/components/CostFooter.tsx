import React from "react";
import { Coins, Cpu, CheckCircle2, HelpCircle } from "lucide-react";

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
    <footer className="h-9 border-t border-zinc-800/80 bg-zinc-950 px-4 flex items-center justify-between text-xs text-zinc-400 select-none">
      <div className="flex items-center space-x-4">
        {/* Token metrics */}
        <div className="flex items-center space-x-1.5 font-mono">
          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            {isCostEstimated ? "~" : ""}
            {inputTokens.toLocaleString()} in / {isCostEstimated ? "~" : ""}
            {outputTokens.toLocaleString()} out
          </span>
        </div>

        {/* Cost */}
        <div className="flex items-center space-x-1.5 font-mono">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-zinc-200 font-medium">
            ${totalCostUsd.toFixed(4)}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-sans uppercase font-semibold ${
              isCostEstimated
                ? "bg-amber-950/70 text-amber-400 border border-amber-800/60"
                : "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60"
            }`}
            title={
              isCostEstimated
                ? "Token counts estimated (~1.3 tokens/word) where provider omitted usage"
                : "Exact token counts returned by provider API"
            }
          >
            {isCostEstimated ? "est." : "exact"}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isStreaming ? (
          <div className="flex items-center space-x-1.5 text-indigo-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>{activeSpeaker ? `${activeSpeaker} speaking...` : "Council deliberating..."}</span>
          </div>
        ) : (
          <span className="text-zinc-500 text-[11px] hidden sm:inline">
            Local debate environment · 127.0.0.1
          </span>
        )}
      </div>
    </footer>
  );
};
