import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { SavedSessionItem } from "../types";
import { fetchHistory } from "../api";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeSession: (filepath: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onResumeSession,
}) => {
  const [sessions, setSessions] = useState<SavedSessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const items = await fetchHistory();
      setSessions(items);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = sessions.filter(
    (s) =>
      s.topic.toLowerCase().includes(search.toLowerCase()) ||
      s.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-surface-1 border-l border-subtle h-full flex flex-col shadow-none transition-colors duration-150">
        {/* Header */}
        <div className="h-16 px-6 border-b border-subtle flex items-center justify-between bg-surface-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">•</span>
            <div>
              <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary">
                Debate History
              </h3>
              <p className="text-[12px] leading-[16px] font-mono text-text-tertiary">
                ~/council-sessions/ ({sessions.length})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadSessions}
              className="p-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
              title="Refresh sessions"
            >
              <Icon name="refresh-cw" size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
              title="Close drawer"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-subtle bg-surface-1">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-text-tertiary pointer-events-none">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search past debates…"
              className="w-full bg-surface-2 border border-subtle rounded-pill pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-strong transition-colors duration-150"
            />
          </div>
        </div>

        {/* Sessions list in list-row style */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-[12px] font-mono text-text-tertiary">
              Loading session files…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-text-secondary">
              {search ? "No matching sessions found." : "No saved debates in ~/council-sessions/ yet."}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.filepath}
                onClick={() => {
                  onResumeSession(item.filepath);
                  onClose();
                }}
                className="w-full text-left group p-3.5 rounded-[12px] border border-subtle bg-surface-2 hover:border-strong transition-colors duration-150 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] leading-[20px] font-semibold text-text-primary group-hover:text-text-primary transition-colors line-clamp-2">
                    {item.topic}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] leading-[16px] font-mono text-text-tertiary mt-1.5">
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>{item.message_count} turns</span>
                    <span>·</span>
                    <span className="truncate max-w-[120px]">{item.filename}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-8 px-3 rounded-pill bg-btn-secondary-bg hover:bg-btn-secondary-hover border border-subtle text-[12px] font-medium text-text-primary flex items-center gap-1.5 transition-colors duration-150">
                    <span>Reopen</span>
                    <span className="text-text-tertiary group-hover:translate-x-0.5 transition-transform duration-150">
                      <Icon name="chevron-right" size={14} />
                    </span>
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
