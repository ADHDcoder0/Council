import React, { useState, useEffect } from "react";
import { X, Search, FileText, ArrowRight, RefreshCw } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-white">Saved Sessions</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={loadSessions}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved debates..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Loading session files...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              {search ? "No matching sessions found." : "No saved debates in ~/council-sessions/ yet."}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.filepath}
                className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-200 line-clamp-2">
                    {item.topic}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-1 font-mono">
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>{item.message_count} messages</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                    {item.filename}
                  </span>
                  <button
                    onClick={() => {
                      onResumeSession(item.filepath);
                      onClose();
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
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
