import React, { useState, useEffect } from "react";
import { X, Search, FileText, ArrowRight, RefreshCw, BookOpen } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-[var(--council-surface-1)] border-l border-[var(--council-border-strong)] h-full flex flex-col shadow-2xl transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-[var(--council-border)] flex items-center justify-between bg-[var(--council-surface-2)]">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[var(--council-accent)]" />
            <div>
              <h3 className="font-semibold text-sm text-[var(--council-text)]">
                Debate history
              </h3>
              <p className="text-[10px] text-[var(--council-text-muted)]">
                {sessions.length} sessions stored in ~/council-sessions/
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={loadSessions}
              className="p-1 rounded-md text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[var(--council-border)] bg-[var(--council-surface-2)]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--council-text-faint)] absolute left-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics…"
              className="w-full bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded-md pl-9 pr-3 py-1.5 text-xs text-[var(--council-text)] placeholder-[var(--council-text-faint)] focus:outline-none focus:border-[var(--council-accent)]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--council-text-muted)] font-mono">
              Loading session files…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--council-text-muted)]">
              {search ? "No matching sessions found." : "No saved debates in ~/council-sessions/ yet."}
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.filepath}
                className="p-3 rounded-lg border border-[var(--council-border)] bg-[var(--council-surface-2)] hover:border-[var(--council-border-strong)] transition flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--council-surface-3)] border border-[var(--council-border)] flex items-center justify-center font-mono text-[10px] text-[var(--council-text-muted)] shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--council-text)] line-clamp-2 leading-snug">
                      {item.topic}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-[var(--council-text-faint)] mt-1 font-mono">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>{item.message_count} entries</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--council-border)] text-xs">
                  <code className="text-[10px] text-[var(--council-text-faint)] font-mono truncate max-w-[180px]">
                    {item.filename}
                  </code>
                  <button
                    onClick={() => {
                      onResumeSession(item.filepath);
                      onClose();
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[var(--council-surface-1)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text)] text-xs font-medium transition"
                  >
                    <span>Reopen</span>
                    <ArrowRight className="w-3 h-3 text-[var(--council-accent)]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
