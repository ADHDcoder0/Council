import React from "react";
import { MemberInfo, TranscriptEntry } from "../types";
import { MemberSidebar } from "./MemberSidebar";
import { TranscriptView } from "./TranscriptView";
import { StatusPill } from "./StatusPill";
import { Icon } from "./Icon";

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
    <div className="flex-1 flex overflow-hidden bg-canvas">
      {/* Panel 1: Roster Rail */}
      <MemberSidebar
        members={members}
        activeSpeaker={activeSpeaker}
        onToggleMute={onToggleMute}
        onEditMember={onEditMember}
      />

      {/* Panel 2: Transcript Stream */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-subtle overflow-hidden">
        <div className="p-3 px-6 border-b border-subtle bg-surface-1 font-mono text-[12px] text-text-tertiary flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-text-tertiary">•</span>
            <span>Transcript</span>
          </span>
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
      <aside className="hidden xl:flex w-80 flex-col bg-surface-1 p-4 overflow-y-auto space-y-4 shrink-0 select-none">
        <div className="text-[14px] leading-[20px] font-semibold text-text-primary flex items-center gap-2">
          <span className="text-text-tertiary">•</span>
          <span>Diagnostics Inspector</span>
        </div>

        {/* Active speaker card */}
        {activeMember && (
          <div className="p-3.5 rounded-[12px] bg-surface-2 border border-subtle space-y-2">
            <span className="text-[11px] font-mono uppercase text-text-tertiary block">
              Member Focus
            </span>
            <div className="flex items-center gap-2">
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
              <strong className="text-[14px] leading-[20px] font-semibold text-text-primary">
                {activeMember.name}
              </strong>
              {activeMember.is_chair && (
                <StatusPill variant="warning" label="Chair" showDot={false} />
              )}
            </div>
            <div className="text-[12px] font-mono text-text-secondary">
              {activeMember.provider} · {activeMember.model}
            </div>
            <p className="text-[13px] leading-[18px] text-text-secondary line-clamp-3">
              {activeMember.role}
            </p>
          </div>
        )}

        {/* Cost Meter Gauge */}
        <div className="p-3.5 rounded-[12px] bg-surface-2 border border-subtle space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-text-tertiary">
              Cost Meter
            </span>
            <StatusPill
              variant={totals.isEstimated ? "warning" : "success"}
              label={totals.isEstimated ? "ESTIMATED" : "EXACT"}
            />
          </div>

          <div className="font-mono text-[20px] font-semibold text-text-primary">
            ${totals.totalCostUsd.toFixed(4)}
          </div>

          {/* Budget progress bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-surface-3 rounded-pill overflow-hidden">
              <div
                className="h-full bg-accent-success transition-all duration-300"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-tertiary">
              <span>Used: {progressPercent}%</span>
              <span>Ref limit: ${maxBudget.toFixed(4)}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-subtle text-[12px] font-mono">
            <div>
              <span className="text-text-tertiary block">Input tokens</span>
              <span className="text-text-primary font-medium">
                {totals.inputTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary block">Output tokens</span>
              <span className="text-text-primary font-medium">
                {totals.outputTokens.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostics & Pricing Notes */}
        <div className="p-3.5 rounded-[12px] bg-surface-2 border border-subtle text-[12px] leading-[18px] text-text-secondary space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-text-primary">
            <Icon name="file-text" size={14} />
            <span>Usage Telemetry</span>
          </div>
          <p>
            SSE streams stream exact usage blocks for Anthropic and OpenAI. Fallback heuristic (1.3 tok/word) is applied only when providers omit usage fields.
          </p>
        </div>
      </aside>
    </div>
  );
};
