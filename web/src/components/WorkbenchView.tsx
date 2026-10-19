import React from "react";
import { MemberInfo, TranscriptEntry, getMemberTone } from "../types";
import { MemberSidebar } from "./MemberSidebar";
import { TranscriptView } from "./TranscriptView";
import { Cpu, DollarSign, Activity, CheckCircle2, ShieldAlert } from "lucide-react";

interface WorkbenchViewProps {
  members: MemberInfo[];
  transcript: TranscriptEntry[];
  topic: string;
  activeSpeaker: string | null;
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalCostUsd: number;
    isEstimated: boolean;
  };
  onToggleMute: (name: string, currentMuted: boolean) => void;
  onEditMember: (member: MemberInfo) => void;
  onRetrySpeaker?: (speaker: string) => void;
  onOpenKeys?: () => void;
  onNewDebate?: () => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  members,
  transcript,
  topic,
  activeSpeaker,
  totals,
  onToggleMute,
  onEditMember,
  onRetrySpeaker,
  onOpenKeys,
  onNewDebate,
}) => {
  const activeMember = members.find((m) => m.name === activeSpeaker) || members[0];
  const maxBudget = 0.08;
  const progressPercent = Math.min(100, Math.round((totals.totalCostUsd / maxBudget) * 100));

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--council-canvas)]">
      {/* Panel 1: Roster Rail */}
      <MemberSidebar
        members={members}
        activeSpeaker={activeSpeaker}
        onToggleMute={onToggleMute}
        onEditMember={onEditMember}
      />

      {/* Panel 2: Transcript Stream */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--council-border)] overflow-hidden">
        <div className="p-2.5 px-4 border-b border-[var(--council-border)] bg-[var(--council-surface-1)] font-mono text-[11px] text-[var(--council-text-muted)] uppercase tracking-wider flex items-center justify-between">
          <span>Deliberation Transcript</span>
          <span>{transcript.length} turns</span>
        </div>
        <TranscriptView
          transcript={transcript}
          topic={topic}
          onRetrySpeaker={onRetrySpeaker}
          onOpenKeys={onOpenKeys}
          onNewDebate={onNewDebate}
        />
      </div>

      {/* Panel 3: Live Inspector & Diagnostics */}
      <aside className="hidden xl:flex w-80 flex-col bg-[var(--council-surface-1)] p-4 overflow-y-auto space-y-4 shrink-0 select-none">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--council-text-muted)]">
          Live Diagnostics Inspector
        </div>

        {/* Active speaker card */}
        {activeMember && (
          <div className="p-3.5 rounded-lg bg-[var(--council-surface-2)] border border-[var(--council-border)] space-y-2">
            <span className="text-[10px] font-mono uppercase text-[var(--council-text-faint)] block">
              Active Member Focus
            </span>
            <div className="flex items-center space-x-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    activeMember.tone === "chair"
                      ? "var(--member-chair)"
                      : activeMember.tone === "skeptic"
                      ? "var(--member-skeptic)"
                      : activeMember.tone === "visionary"
                      ? "var(--member-visionary)"
                      : "var(--member-builder)",
                }}
              />
              <strong className="text-xs text-[var(--council-text)]">
                {activeMember.name}
              </strong>
              {activeMember.is_chair && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--council-surface-3)] text-[var(--council-warning)]">
                  Chair
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-[var(--council-text-faint)]">
              {activeMember.provider} · {activeMember.model}
            </div>
            <p className="text-[11px] text-[var(--council-text-muted)] line-clamp-3 leading-relaxed">
              {activeMember.role}
            </p>
          </div>
        )}

        {/* Cost Meter Gauge */}
        <div className="p-3.5 rounded-lg bg-[var(--council-surface-2)] border border-[var(--council-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[var(--council-text-faint)]">
              Session Cost
            </span>
            <span
              className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                totals.isEstimated
                  ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                  : "bg-[var(--council-success-bg)] text-[var(--council-accent)]"
              }`}
            >
              {totals.isEstimated ? "Estimated" : "Exact"}
            </span>
          </div>

          <div className="font-mono text-xl font-bold text-[var(--council-text)]">
            ${totals.totalCostUsd.toFixed(4)}
          </div>

          {/* Budget progress bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-[var(--council-surface-3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--council-accent)] transition-all duration-300"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[var(--council-text-faint)]">
              <span>Used: {progressPercent}%</span>
              <span>Limit: ${maxBudget.toFixed(4)}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--council-border)] text-[10px] font-mono">
            <div>
              <span className="text-[var(--council-text-faint)] block">Input tokens</span>
              <span className="text-[var(--council-text)] font-semibold">
                {totals.inputTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[var(--council-text-faint)] block">Output tokens</span>
              <span className="text-[var(--council-text)] font-semibold">
                {totals.outputTokens.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostics & Pricing Notes */}
        <div className="p-3 rounded-lg bg-[var(--council-surface-2)] border border-[var(--council-border)] text-[10px] text-[var(--council-text-muted)] space-y-1.5 leading-relaxed">
          <div className="flex items-center space-x-1 font-semibold text-[var(--council-text)]">
            <Activity className="w-3 h-3 text-[var(--council-accent)]" />
            <span>Usage Telemetry</span>
          </div>
          <p>
            Provider SSE streaming reports exact input & output tokens for Anthropic and OpenAI. Fallback heuristic (1.3 tok/word) is used only when providers omit usage blocks.
          </p>
        </div>
      </aside>
    </div>
  );
};
