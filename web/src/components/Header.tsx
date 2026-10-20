import React, { useState } from "react";
import { Icon } from "./Icon";
import { Direction } from "../types";

interface HeaderProps {
  topic: string;
  sessionId: string | null;
  direction?: Direction;
  theme: "light" | "dark";
  onDirectionChange?: (direction: Direction) => void;
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
    <header className="h-14 border-b border-subtle bg-surface-1 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 select-none transition-colors duration-150">
      {/* Left: Session title in Page Title style (20/28 600) + Mono caption session ID pill */}
      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
        <h1
          className="text-[17px] md:text-[20px] leading-[26px] md:leading-[28px] font-semibold text-text-primary truncate max-w-md lg:max-w-xl"
          title={topic || "Council Deliberation"}
        >
          {topic || "Council"}
        </h1>

        {sessionId && (
          <span
            className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-2 border border-subtle text-text-tertiary font-mono text-[12px] leading-[16px] shrink-0"
            title={`Session ID: ${sessionId}`}
          >
            {sessionId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Optional mode toggles: Pill-shaped nav if onDirectionChange provided */}
      {direction && onDirectionChange && (
        <div className="hidden xl:flex items-center p-0.5 rounded-pill bg-surface-2 border border-subtle">
          <button
            onClick={() => onDirectionChange("thread")}
            className={`px-3 py-1 rounded-pill text-[12px] leading-[16px] font-medium transition-colors duration-150 ${
              direction === "thread"
                ? "bg-surface-3 text-text-primary shadow-none"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Deliberation
          </button>
          <button
            onClick={() => onDirectionChange("workbench")}
            className={`px-3 py-1 rounded-pill text-[12px] leading-[16px] font-medium transition-colors duration-150 ${
              direction === "workbench"
                ? "bg-surface-3 text-text-primary shadow-none"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Workbench
          </button>
          <button
            onClick={() => onDirectionChange("arena")}
            className={`px-3 py-1 rounded-pill text-[12px] leading-[16px] font-medium transition-colors duration-150 ${
              direction === "arena"
                ? "bg-surface-3 text-text-primary shadow-none"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Roundtable
          </button>
        </div>
      )}

      {/* Right: Pill action group */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Light primary CTA: New Debate */}
        <button
          onClick={onNewDebate}
          className="h-9 px-3.5 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5 shadow-none shrink-0"
          title="Start a new council debate"
        >
          <Icon name="plus" size={16} strokeWidth={2.2} />
          <span>New Debate</span>
        </button>

        {/* Unified secondary pill container so the bar reads as one unit */}
        <div className="flex items-center p-0.5 rounded-pill bg-surface-2 border border-subtle">
          <button
            onClick={onOpenHistory}
            className="h-8 px-2.5 sm:px-3 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            title="Debate history"
          >
            <Icon name="history" size={16} />
            <span className="hidden sm:inline">History</span>
          </button>

          <button
            onClick={onOpenKeys}
            className="h-8 px-2.5 sm:px-3 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            title="Provider API keys"
          >
            <Icon name="key-round" size={16} />
            <span className="hidden sm:inline">API Keys</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="h-8 px-2.5 sm:px-3 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            title="Council settings"
          >
            <Icon name="settings" size={16} />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Export dropdown */}
          {sessionId && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-8 px-2 sm:px-2.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-1"
                title="Export session"
              >
                <Icon name="download" size={16} />
                <span className="hidden md:inline">Export</span>
              </button>

              {showExportMenu && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-surface-1 border border-strong rounded-panel shadow-none py-1 z-50 text-[13px] leading-[18px] overflow-hidden"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <button
                    onClick={() => {
                      onExport("markdown");
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      onExport("json");
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
                  >
                    JSON (.json)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="h-8 w-8 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-3 flex items-center justify-center transition-colors duration-150"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
