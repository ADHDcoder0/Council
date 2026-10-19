import React, { useState } from "react";
import { Plus, History, Settings, Download, Key } from "lucide-react";

interface HeaderProps {
  topic: string;
  sessionId: string | null;
  onNewDebate: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenKeys: () => void;
  onExport: (format: "markdown" | "json") => void;
}

export const Header: React.FC<HeaderProps> = ({
  topic,
  sessionId,
  onNewDebate,
  onOpenHistory,
  onOpenSettings,
  onOpenKeys,
  onExport,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900/70 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xl">🏛️</span>
          <span className="font-bold tracking-tight text-white hidden sm:inline">Council</span>
        </div>

        {topic && (
          <div className="flex items-center space-x-2 truncate">
            <span className="text-zinc-500">/</span>
            <span className="text-sm font-medium text-zinc-300 truncate max-w-xs md:max-w-md lg:max-w-xl">
              {topic}
            </span>
            {sessionId && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                {sessionId}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={onNewDebate}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
          title="Start a new debate session"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Debate</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          title="Saved sessions"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </button>

        <button
          onClick={onOpenKeys}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border border-amber-900/40 text-xs font-medium transition"
          title="Enter or view provider API keys"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API Keys</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          title="Configure council personas and models"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {sessionId && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
              title="Export debate"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-36 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    onExport("markdown");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Download .md
                </button>
                <button
                  onClick={() => {
                    onExport("json");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Download .json
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
