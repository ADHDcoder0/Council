import React from "react";
import { Mic, MicOff, Type, Crown } from "lucide-react";
import { MemberInfo, getMemberTone } from "../types";

interface MemberSidebarProps {
  members: MemberInfo[];
  activeSpeaker: string | null;
  onToggleMute: (name: string, currentMuted: boolean) => void;
  onEditMember: (member: MemberInfo) => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({
  members,
  activeSpeaker,
  onToggleMute,
  onEditMember,
}) => {
  return (
    <aside className="w-full lg:w-72 xl:w-80 border-r border-[var(--council-border)] bg-[var(--council-surface-1)] p-4 flex flex-col shrink-0 overflow-y-auto select-none transition-colors">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--council-text-muted)]">
          Council Members ({members.length})
        </span>
      </div>

      <div className="space-y-2.5 flex-1">
        {members.map((member) => {
          const isSpeaking = activeSpeaker === member.name;
          const isMuted = member.is_muted;
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
              key={member.name}
              style={{
                borderLeftColor: toneColor,
                borderLeftWidth: "2px",
              }}
              className={`relative rounded-lg p-3 bg-[var(--council-surface-2)] border border-[var(--council-border)] transition-all ${
                isSpeaking
                  ? "ring-1 ring-[var(--council-accent)] shadow-md bg-[var(--council-surface-3)]"
                  : isMuted
                  ? "opacity-50"
                  : "hover:border-[var(--council-border-strong)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: toneColor }}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-xs text-[var(--council-text)] truncate">
                    {member.name}
                  </span>
                  {member.is_chair && (
                    <span className="inline-flex items-center space-x-0.5 text-[10px] font-medium text-[var(--council-warning)] bg-[var(--council-surface-3)] border border-[var(--council-border)] px-1.5 py-0.2 rounded-full font-mono shrink-0">
                      <Crown className="w-2.5 h-2.5 mr-0.5" />
                      Chair
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {!member.is_chair && (
                    <button
                      onClick={() => onToggleMute(member.name, isMuted)}
                      className={`p-1 rounded hover:bg-[var(--council-surface-3)] transition ${
                        isMuted
                          ? "text-[var(--council-danger)]"
                          : "text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
                      }`}
                      title={isMuted ? "Unmute member" : "Mute member"}
                    >
                      {isMuted ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onEditMember(member)}
                    className="p-1 rounded text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
                    title={`Edit ${member.name} persona`}
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Provider & Model badge */}
              <div className="mt-1.5 flex items-center space-x-1.5 font-mono text-[10px] text-[var(--council-text-faint)]">
                <span className="uppercase font-semibold" style={{ color: toneColor }}>
                  {member.provider}
                </span>
                <span>·</span>
                <code className="text-[var(--council-text-muted)] truncate max-w-[150px]">
                  {member.model}
                </code>
              </div>

              {/* Role description */}
              <p className="mt-1.5 text-[11px] text-[var(--council-text-muted)] line-clamp-2 leading-relaxed">
                {member.role}
              </p>

              {/* Activity indicator */}
              {isSpeaking && (
                <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[var(--council-success-bg)] text-[var(--council-accent)] text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--council-accent)] animate-ping" />
                  <span>Generating response...</span>
                </div>
              )}
              {isMuted && (
                <div className="mt-2 text-[10px] text-[var(--council-text-faint)] font-mono">
                  Skipped in next round
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
