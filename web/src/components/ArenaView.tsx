import React from "react";
import { MemberInfo, TranscriptEntry, getMemberTone } from "../types";
import { TranscriptView } from "./TranscriptView";
import { StatusPill } from "./StatusPill";
import { Icon } from "./Icon";

interface ArenaViewProps {
  members: MemberInfo[];
  transcript: TranscriptEntry[];
  topic: string;
  activeSpeaker: string | null;
  onToggleMute: (name: string, currentMuted: boolean) => void;
  onEditMember: (member: MemberInfo) => void;
  onRetrySpeaker?: (speaker: string) => void;
  onOpenKeys?: () => void;
  onNewDebate?: () => void;
}

export const ArenaView: React.FC<ArenaViewProps> = ({
  members,
  transcript,
  topic,
  activeSpeaker,
  onToggleMute,
  onEditMember,
  onRetrySpeaker,
  onOpenKeys,
  onNewDebate,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-canvas transition-colors duration-150">
      {/* Roundtable Stage Area */}
      <div className="relative min-h-[360px] md:min-h-[420px] p-6 flex items-center justify-center border-b border-subtle overflow-hidden shrink-0">
        {/* Concentric rings */}
        <div className="absolute w-[440px] h-[440px] rounded-full border border-subtle pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-subtle pointer-events-none" />

        {/* Center Topic Pod */}
        <div className="relative z-10 max-w-xs md:max-w-sm p-5 rounded-[16px] bg-surface-1 border border-subtle shadow-none text-center space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary block">
            Question under debate
          </span>
          <h2 className="text-[15px] leading-[22px] font-semibold text-text-primary line-clamp-3">
            {topic || "What should the council deliberate?"}
          </h2>
          <div className="pt-1">
            <StatusPill
              variant={activeSpeaker ? "success" : "neutral"}
              label={activeSpeaker ? `Speaking: ${activeSpeaker}` : "Round in session"}
            />
          </div>
        </div>

        {/* Council Members Arranged Around Table */}
        <div className="absolute inset-4 md:inset-8 pointer-events-none">
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Top row */}
            <div className="flex justify-between">
              {members[0] && (
                <div className="pointer-events-auto max-w-[200px] sm:max-w-[240px]">
                  <MemberArenaCard
                    member={members[0]}
                    isActive={activeSpeaker === members[0].name}
                    onToggleMute={onToggleMute}
                    onEditMember={onEditMember}
                  />
                </div>
              )}
              {members[1] && (
                <div className="pointer-events-auto max-w-[200px] sm:max-w-[240px]">
                  <MemberArenaCard
                    member={members[1]}
                    isActive={activeSpeaker === members[1].name}
                    onToggleMute={onToggleMute}
                    onEditMember={onEditMember}
                  />
                </div>
              )}
            </div>

            {/* Bottom row */}
            <div className="flex justify-between">
              {members[2] && (
                <div className="pointer-events-auto max-w-[200px] sm:max-w-[240px]">
                  <MemberArenaCard
                    member={members[2]}
                    isActive={activeSpeaker === members[2].name}
                    onToggleMute={onToggleMute}
                    onEditMember={onEditMember}
                  />
                </div>
              )}
              {members[3] && (
                <div className="pointer-events-auto max-w-[200px] sm:max-w-[240px]">
                  <MemberArenaCard
                    member={members[3]}
                    isActive={activeSpeaker === members[3].name}
                    onToggleMute={onToggleMute}
                    onEditMember={onEditMember}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Deliberation transcript stream below the arena */}
      <div className="flex-1 min-h-[300px]">
        <TranscriptView
          transcript={transcript}
          topic=""
          onRetrySpeaker={onRetrySpeaker}
          onOpenKeys={onOpenKeys}
          onNewDebate={onNewDebate}
        />
      </div>
    </div>
  );
};

function MemberArenaCard({
  member,
  isActive,
  onToggleMute,
  onEditMember,
}: {
  member: MemberInfo;
  isActive: boolean;
  onToggleMute: (name: string, currentMuted: boolean) => void;
  onEditMember: (member: MemberInfo) => void;
}) {
  const tone = member.tone || getMemberTone(member.name, member.is_chair);
  const getToneColor = () => {
    switch (tone) {
      case "chair":
        return "var(--member-chair)";
      case "skeptic":
        return "var(--member-skeptic)";
      case "builder":
        return "var(--member-builder)";
      case "visionary":
        return "var(--member-visionary)";
      default:
        return "var(--member-builder)";
    }
  };

  const toneColor = getToneColor();

  return (
    <div
      style={{
        borderLeftColor: toneColor,
        borderLeftWidth: "2px",
      }}
      className={`p-3 rounded-[12px] bg-surface-2 border border-subtle transition-colors duration-150 ${
        isActive
          ? "ring-1 ring-border-strong bg-surface-3"
          : member.is_muted
          ? "opacity-55"
          : "hover:border-strong"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 truncate">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: toneColor }}
          />
          <strong className="text-[13px] font-semibold text-text-primary truncate">
            {member.name}
          </strong>
          {member.is_chair && (
            <StatusPill variant="warning" label="Chair" showDot={false} className="px-1 py-0 text-[9px]" />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!member.is_chair && (
            <button
              onClick={() => onToggleMute(member.name, member.is_muted)}
              className={`px-1.5 py-0.5 rounded-pill text-[10px] font-mono uppercase tracking-[0.06em] font-semibold transition-colors duration-150 ${
                member.is_muted
                  ? "bg-accent-danger-bg text-accent-danger border border-subtle"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              {member.is_muted ? "Muted" : "Mute"}
            </button>
          )}
          <button
            onClick={() => onEditMember(member)}
            className="p-1 rounded-pill text-text-tertiary hover:text-text-primary"
          >
            <Icon name="pencil" size={13} />
          </button>
        </div>
      </div>
      <div className="mt-1 text-[11px] font-mono text-text-secondary truncate">
        {member.provider} · {member.model}
      </div>
      {isActive && (
        <div className="mt-1.5">
          <StatusPill variant="success" label="Responding" />
        </div>
      )}
    </div>
  );
}
