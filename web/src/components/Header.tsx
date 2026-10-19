import React, { useState } from "react";
import {
  Wand2,
  Book,
  Key,
  Sliders,
  Download,
  Sun,
  Moon,
  Columns,
  AlignLeft,
  CircleDot,
  Terminal,
} from "lucide-react";
import { Direction } from "../types";

interface HeaderProps {
  topic: string;
  sessionId: string | null;
  direction: Direction;
  theme: "light" | "dark";
  onDirectionChange: (direction: Direction) => void;
  onToggleTheme: () => void;
  onNewDebate: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenKeys: () => void;
  onExport: (format: "markdown" | "json") => void;
}

export const Header: React.FC<HeaderProps> = ({
  topic,
  sessionId,
  direction,
  theme,
  onDirectionChange,
  onToggleTheme,
  onNewDebate,
  onOpenHistory,
  onOpenSettings,
  onOpenKeys,
  onExport,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 border-b border-[var(--council-border)] bg-[var(--council-surface-1)] px-4 flex items-center justify-between sticky top-0 z-40 select-none transition-colors">
      {/* Brand & Active Topic Identity */}
      <div className="flex items-center space-x-3 overflow-hidden min-w-0">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--council-surface-2)] border border-[var(--council-border-strong)] flex items-center justify-center text-[var(--council-accent)] shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-semibold text-sm leading-tight text-[var(--council-text)]">
              Council
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--council-text-faint)]">
              Local · 127.0.0.1
            </span>
          </div>
        </div>

        {topic && (
          <div className="flex items-center space-x-2 truncate min-w-0 pl-1 border-l border-[var(--council-border)]">
            <span className="text-[var(--council-text-faint)] text-xs font-mono">/</span>
            <span
              className="text-xs font-medium text-[var(--council-text)] truncate max-w-xs md:max-w-sm lg:max-w-md"
              title={topic}
            >
              {topic}
            </span>
            {sessionId && (
              <code className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--council-surface-2)] border border-[var(--council-border)] text-[var(--council-text-muted)] font-mono shrink-0">
                {sessionId.slice(0, 8)}
              </code>
            )}
          </div>
        )}
      </div>

      {/* Center Direction Tabs (Deliberation, Workbench, Arena) */}
      <div className="hidden md:flex items-center space-x-1 p-0.5 rounded-lg bg-[var(--council-surface-2)] border border-[var(--council-border)] text-xs">
        <button
          onClick={() => onDirectionChange("thread")}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
            direction === "thread"
              ? "bg-[var(--council-surface-1)] text-[var(--council-text)] shadow-sm border border-[var(--council-border)] font-semibold"
              : "text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
          }`}
          title="The Deliberation: long-form conversational thread"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Deliberation</span>
        </button>

        <button
          onClick={() => onDirectionChange("workbench")}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
            direction === "workbench"
              ? "bg-[var(--council-surface-1)] text-[var(--council-text)] shadow-sm border border-[var(--council-border)] font-semibold"
              : "text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
          }`}
          title="The Workbench: modular 3-panel workspace with diagnostics inspector"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Workbench</span>
        </button>

        <button
          onClick={() => onDirectionChange("arena")}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
            direction === "arena"
              ? "bg-[var(--council-surface-1)] text-[var(--council-text)] shadow-sm border border-[var(--council-border)] font-semibold"
              : "text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
          }`}
          title="The Roundtable: spatial arena layout"
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>Roundtable</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1.5 shrink-0">
        <button
          onClick={onNewDebate}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--council-accent)] hover:opacity-90 text-[var(--bg-canvas)] text-xs font-semibold transition shadow-sm"
          title="Start a new council debate"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New debate</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs font-medium transition"
          title="Saved sessions"
        >
          <Book className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </button>

        <button
          onClick={onOpenKeys}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs font-medium transition"
          title="Provider API keys"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API keys</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs font-medium transition"
          title="Configure council rules, members, and prices"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {sessionId && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded-lg bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs transition"
              title="Export debate"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-36 bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] rounded-lg shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    onExport("markdown");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[var(--council-text-muted)] hover:bg-[var(--council-surface-2)] hover:text-[var(--council-text)] transition"
                >
                  Download .md
                </button>
                <button
                  onClick={() => {
                    onExport("json");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[var(--council-text-muted)] hover:bg-[var(--council-surface-2)] hover:text-[var(--council-text)] transition"
                >
                  Download .json
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs transition"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
};
