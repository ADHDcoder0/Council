import React from "react";
import { MemberInfo, TranscriptEntry, getMemberTone } from "../types";
import { TranscriptView } from "./TranscriptView";
import { Mic, MicOff, Type, Crown, Terminal } from "lucide-react";

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
    <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--council-canvas)] transition-colors">
      {/* Roundtable Stage Area */}
      <div className="relative min-h-[360px] md:min-h-[420px] p-6 flex items-center justify-center border-b border-[var(--council-border)] overflow-hidden shrink-0">
        {/* Concentric rings */}
        <div className="absolute w-[440px] h-[440px] rounded-full border border-[var(--council-border)] pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-[var(--council-border)] pointer-events-none" />

        {/* Center Topic Pod */}
        <div className="relative z-10 max-w-xs md:max-w-sm p-5 rounded-2xl bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] shadow-xl text-center space-y-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--council-text-muted)] block">
            Question under debate
          </span>
          <h2 className="text-sm font-semibold text-[var(--council-text)] leading-snug line-clamp-3">
            {topic || "What should the council deliberate?"}
          </h2>
          <div className="pt-1">
            <span className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--council-surface-2)] text-[var(--council-accent)] font-semibold border border-[var(--council-border)]">
              {activeSpeaker ? `Speaking: ${activeSpeaker}` : "Round in session"}
            </span>
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
        borderTopColor: toneColor,
        borderTopWidth: "2px",
      }}
      className={`p-2.5 rounded-lg bg-[var(--council-surface-1)] border border-[var(--council-border)] shadow-md transition-all ${
        isActive
          ? "ring-2 ring-[var(--council-accent)] shadow-lg scale-105"
          : member.is_muted
          ? "opacity-50"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center space-x-1.5 truncate">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: toneColor }}
          />
          <strong className="text-xs text-[var(--council-text)] truncate">
            {member.name}
          </strong>
          {member.is_chair && (
            <Crown className="w-2.5 h-2.5 text-[var(--council-warning)] shrink-0" />
          )}
        </div>
        <div className="flex items-center space-x-0.5 shrink-0">
          {!member.is_chair && (
            <button
              onClick={() => onToggleMute(member.name, member.is_muted)}
              className="p-1 rounded text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
            >
              {member.is_muted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={() => onEditMember(member)}
            className="p-1 rounded text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
          >
            <Type className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="mt-1 text-[10px] font-mono text-[var(--council-text-faint)] truncate">
        {member.provider} · {member.model}
      </div>
      {isActive && (
        <span className="mt-1.5 inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--council-success-bg)] text-[var(--council-accent)]">
          Speaking now
        </span>
      )}
    </div>
  );
}
