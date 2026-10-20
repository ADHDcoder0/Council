import React from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
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
    <aside className="w-full lg:w-72 xl:w-80 border-r border-subtle bg-surface-1 p-4 flex flex-col shrink-0 overflow-y-auto select-none transition-colors duration-150">
      {/* Section label with a dot prefix */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[15px] md:text-[16px] leading-[24px] font-semibold text-text-primary flex items-center gap-2">
          <span className="text-text-tertiary">•</span>
          <span>Council members ({members.length})</span>
        </h2>
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
              className={`group relative rounded-[12px] p-3.5 bg-surface-2 border border-subtle transition-colors duration-150 ${
                isSpeaking
                  ? "bg-surface-3 ring-1 ring-border-strong"
                  : isMuted
                  ? "opacity-55"
                  : "hover:border-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: toneColor }}
                    aria-hidden="true"
                  />
                  <span className="text-[14px] leading-[20px] font-semibold text-text-primary truncate">
                    {member.name}
                  </span>

                  {member.is_chair && (
                    <StatusPill variant="warning" label="Chair" showDot={false} />
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Labeled mute toggle */}
                  {!member.is_chair && (
                    <button
                      onClick={() => onToggleMute(member.name, isMuted)}
                      className={`px-2 py-0.5 rounded-pill text-[11px] leading-[14px] font-mono uppercase tracking-[0.06em] font-semibold transition-colors duration-150 ${
                        isMuted
                          ? "bg-accent-danger-bg text-accent-danger border border-subtle"
                          : "text-text-tertiary hover:text-text-primary hover:bg-surface-3 border border-transparent hover:border-subtle"
                      }`}
                      title={isMuted ? "Unmute member" : "Mute member"}
                    >
                      {isMuted ? "Muted" : "Mute"}
                    </button>
                  )}

                  {/* Ghost edit icon button on hover */}
                  <button
                    onClick={() => onEditMember(member)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-pill text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
                    title={`Edit ${member.name} persona`}
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                </div>
              </div>

              {/* Provider & Model badge */}
              <div className="mt-2 flex items-center gap-1.5 font-mono text-[12px] leading-[16px] text-text-secondary">
                <StatusPill
                  variant="neutral"
                  label={member.provider.toUpperCase()}
                  showDot={false}
                  className="px-1.5 py-0 text-[10px]"
                />
                <span className="text-text-tertiary">·</span>
                <span className="text-text-secondary truncate max-w-[150px]">
                  {member.model}
                </span>
              </div>

              {/* Role description in secondary body text clamped to two lines */}
              <p className="mt-2 text-[13px] leading-[18px] text-text-secondary line-clamp-2">
                {member.role}
              </p>

              {/* Activity indicator */}
              {isSpeaking && (
                <div className="mt-2.5">
                  <StatusPill variant="success" label="Responding" showDot={true} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
