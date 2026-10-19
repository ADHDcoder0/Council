import React from "react";
import { Volume2, VolumeX, Edit3, Crown } from "lucide-react";
import { MemberInfo } from "../types";

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
  const getProviderBadge = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "anthropic":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "openai":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "gemini":
        return "bg-sky-950 text-sky-300 border-sky-800";
      case "openrouter":
        return "bg-purple-950 text-purple-300 border-purple-800";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getSpeakerColor = (name: string, isChair: boolean) => {
    if (isChair) return "border-l-yellow-500";
    const lower = name.toLowerCase();
    if (lower.includes("skeptic")) return "border-l-red-500";
    if (lower.includes("builder")) return "border-l-green-500";
    if (lower.includes("visionary")) return "border-l-cyan-500";
    return "border-l-indigo-500";
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80 border-r border-zinc-800 bg-zinc-900/40 p-4 flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Council Members ({members.length})
        </h2>
      </div>

      <div className="space-y-3 flex-1">
        {members.map((member) => {
          const isSpeaking = activeSpeaker === member.name;
          const isMuted = member.is_muted;

          return (
            <div
              key={member.name}
              className={`relative rounded-lg p-3 border transition-all ${
                isSpeaking
                  ? "bg-zinc-800/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50"
                  : isMuted
                  ? "bg-zinc-900/30 border-zinc-800/50 opacity-60"
                  : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
              } border-l-4 ${getSpeakerColor(member.name, member.is_chair)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-white">
                    {member.name}
                  </span>
                  {member.is_chair && (
                    <span className="inline-flex items-center space-x-0.5 text-[10px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.2 rounded-full">
                      <Crown className="w-2.5 h-2.5 mr-0.5" />
                      Chair
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {!member.is_chair && (
                    <button
                      onClick={() => onToggleMute(member.name, isMuted)}
                      className={`p-1 rounded hover:bg-zinc-800 transition ${
                        isMuted ? "text-red-400" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title={isMuted ? "Unmute member" : "Mute member"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onEditMember(member)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                    title="Edit role and model"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Provider & Model badge */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${getProviderBadge(
                    member.provider
                  )}`}
                >
                  {member.provider}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[140px]">
                  {member.model}
                </span>
              </div>

              {/* Role text */}
              <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {member.role}
              </p>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
