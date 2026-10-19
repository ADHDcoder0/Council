import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { MemberSidebar } from "./components/MemberSidebar";
import { TranscriptView } from "./components/TranscriptView";
import { WorkbenchView } from "./components/WorkbenchView";
import { ArenaView } from "./components/ArenaView";
import { Composer } from "./components/Composer";
import { CostFooter } from "./components/CostFooter";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { NewDebateModal } from "./components/NewDebateModal";
import { EditMemberModal } from "./components/EditMemberModal";
import { ApiKeysModal } from "./components/ApiKeysModal";
import { useSSE } from "./hooks/useSSE";
import {
  createSession,
  addMessage,
  patchMember,
  saveSessionToDisk,
  resumeSessionFromFile,
  fetchApiKeys,
  fetchConfig,
} from "./api";
import { Direction, MemberInfo, SessionResponse, TranscriptEntry, getMemberTone } from "./types";
import { Key } from "lucide-react";

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [direction, setDirection] = useState<Direction>("thread");

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [totals, setTotals] = useState({
    inputTokens: 0,
    outputTokens: 0,
    totalCostUsd: 0,
    isEstimated: false,
  });

  const [isNewDebateOpen, setIsNewDebateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [hasAnyKey, setHasAnyKey] = useState(true);
  const [editingMember, setEditingMember] = useState<MemberInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme to root DOM class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const checkKeys = useCallback(async () => {
    try {
      const keys = await fetchApiKeys();
      const anySet = Object.values(keys).some((k) => k.is_set);
      setHasAnyKey(anySet);
    } catch (e) {
      console.error("Failed to check keys:", e);
    }
  }, []);

  useEffect(() => {
    checkKeys();
  }, [checkKeys]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTranscriptUpdate = useCallback(
    (updater: (prev: TranscriptEntry[]) => TranscriptEntry[]) => {
      setTranscript(updater);
    },
    []
  );

  const handleTotalsUpdate = useCallback(
    (newTotals: Partial<typeof totals>) => {
      setTotals((prev) => ({ ...prev, ...newTotals }));
    },
    []
  );

  const { isStreaming, activeSpeaker, startStream, abortStream } = useSSE({
    sessionId: session?.session_id || null,
    onTranscriptUpdate: handleTranscriptUpdate,
    onTotalsUpdate: handleTotalsUpdate,
  });

  // Init default session on mount
  useEffect(() => {
    const initDefaultSession = async () => {
      try {
        const s = await createSession(
          "Should engineering teams prefer a modular monolith over microservices by default?",
          120,
          1
        );
        setSession(s);
        setTranscript(s.transcript);
        setMembers(
          s.members.map((m) => ({
            ...m,
            tone: getMemberTone(m.name, m.is_chair),
          }))
        );
        setTotals({
          inputTokens: s.total_input_tokens,
          outputTokens: s.total_output_tokens,
          totalCostUsd: s.total_cost_usd,
          isEstimated: s.is_cost_estimated,
        });
      } catch (err) {
        console.error("Failed to initialize session:", err);
      }
    };
    initDefaultSession();
  }, []);

  const handleStartNewDebate = async (
    topic: string,
    words: number,
    rounds: number
  ) => {
    try {
      const s = await createSession(topic, words, rounds);
      setSession(s);
      setTranscript(s.transcript);
      setMembers(
        s.members.map((m) => ({
          ...m,
          tone: getMemberTone(m.name, m.is_chair),
        }))
      );
      setTotals({
        inputTokens: s.total_input_tokens,
        outputTokens: s.total_output_tokens,
        totalCostUsd: s.total_cost_usd,
        isEstimated: s.is_cost_estimated,
      });
      showToast("New debate session started.");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!session) return;
    try {
      const updated = await addMessage(session.session_id, "You", text);
      setTranscript(updated.transcript);
    } catch (err: any) {
      showToast(`Error adding message: ${err.message}`);
    }
  };

  const handleToggleMute = async (name: string, currentMuted: boolean) => {
    if (!session) return;
    try {
      const updated = await patchMember(session.session_id, name, {
        is_muted: !currentMuted,
      });
      setMembers((prev) =>
        prev.map((m) => (m.name === name ? { ...m, is_muted: updated.is_muted } : m))
      );
      showToast(`${name} ${!currentMuted ? "muted" : "unmuted"}.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSaveMemberEdit = async (
    name: string,
    updates: Partial<MemberInfo>
  ) => {
    if (!session) return;
    try {
      const updated = await patchMember(session.session_id, name, updates);
      setMembers((prev) =>
        prev.map((m) => (m.name === name ? { ...m, ...updated } : m))
      );
      showToast(`Updated persona for ${name}.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSaveSession = async () => {
    if (!session) return;
    try {
      const res = await saveSessionToDisk(session.session_id);
      showToast(`Saved session to ${res.filename}`);
    } catch (err: any) {
      showToast(`Error saving session: ${err.message}`);
    }
  };

  const handleResumeSession = async (filepath: string) => {
    try {
      const s = await resumeSessionFromFile(filepath);
      setSession(s);
      setTranscript(s.transcript);
      setMembers(
        s.members.map((m) => ({
          ...m,
          tone: getMemberTone(m.name, m.is_chair),
        }))
      );
      setTotals({
        inputTokens: s.total_input_tokens,
        outputTokens: s.total_output_tokens,
        totalCostUsd: s.total_cost_usd,
        isEstimated: s.is_cost_estimated,
      });
      showToast(`Resumed debate: ${s.topic}`);
    } catch (err: any) {
      showToast(`Error resuming session: ${err.message}`);
    }
  };

  const handleExport = (format: "markdown" | "json") => {
    if (!session) return;
    window.location.href = `/api/sessions/${session.session_id}/export?format=${format}`;
  };

  const hasChair = members.some((m) => m.is_chair);

  return (
    <div className="flex flex-col h-screen bg-[var(--council-canvas)] text-[var(--council-text)] overflow-hidden font-sans transition-colors">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 px-3.5 py-2 bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] text-[var(--council-text)] text-xs rounded-lg shadow-2xl flex items-center space-x-2 animate-fade-in font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--council-accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Redesigned App Header */}
      <Header
        topic={session?.topic || ""}
        sessionId={session?.session_id || null}
        direction={direction}
        theme={theme}
        onDirectionChange={setDirection}
        onToggleTheme={toggleTheme}
        onNewDebate={() => setIsNewDebateOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenKeys={() => setIsKeysOpen(true)}
        onExport={handleExport}
      />

      {/* Main Deliberation Stage */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Missing API keys notification banner */}
        {!hasAnyKey && (
          <div className="absolute top-2 left-4 right-4 z-20 px-3.5 py-2 rounded-lg bg-[var(--council-surface-1)] border border-[var(--council-warning)]/60 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2 text-[var(--council-warning)]">
              <Key className="w-4 h-4 shrink-0" />
              <span>No API keys configured yet. Add your Anthropic, OpenAI, Gemini, or OpenRouter keys to run rounds.</span>
            </div>
            <button
              onClick={() => setIsKeysOpen(true)}
              className="px-2.5 py-1 rounded bg-[var(--council-accent)] text-[var(--bg-canvas)] font-semibold text-xs transition shrink-0 ml-3 shadow-sm hover:opacity-90"
            >
              Enter keys
            </button>
          </div>
        )}

        {/* Direction 1: The Deliberation (Thread reading mode) */}
        {direction === "thread" && (
          <div className="flex-1 flex overflow-hidden">
            <MemberSidebar
              members={members}
              activeSpeaker={activeSpeaker}
              onToggleMute={handleToggleMute}
              onEditMember={(m) => setEditingMember(m)}
            />
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--council-canvas)]">
              <TranscriptView
                transcript={transcript}
                topic={session?.topic || ""}
                onRetrySpeaker={(name) => startStream("rounds", { rounds: 1 })}
                onOpenKeys={() => setIsKeysOpen(true)}
                onNewDebate={() => setIsNewDebateOpen(true)}
              />
              <Composer
                isStreaming={isStreaming}
                onSendMessage={handleSendMessage}
                onRunRound={(rounds) => startStream("rounds", { rounds })}
                onRunSummary={() => startStream("summary", {})}
                onRunModerator={() => startStream("moderator", {})}
                onStop={abortStream}
                onSave={handleSaveSession}
                hasChair={hasChair}
              />
            </main>
          </div>
        )}

        {/* Direction 2: The Workbench (3-panel modular workspace) */}
        {direction === "workbench" && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <WorkbenchView
              members={members}
              transcript={transcript}
              topic={session?.topic || ""}
              activeSpeaker={activeSpeaker}
              totals={totals}
              onToggleMute={handleToggleMute}
              onEditMember={(m) => setEditingMember(m)}
              onRetrySpeaker={(name) => startStream("rounds", { rounds: 1 })}
              onOpenKeys={() => setIsKeysOpen(true)}
              onNewDebate={() => setIsNewDebateOpen(true)}
            />
            <Composer
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onRunRound={(rounds) => startStream("rounds", { rounds })}
              onRunSummary={() => startStream("summary", {})}
              onRunModerator={() => startStream("moderator", {})}
              onStop={abortStream}
              onSave={handleSaveSession}
              hasChair={hasChair}
            />
          </div>
        )}

        {/* Direction 3: The Roundtable (Arena mode) */}
        {direction === "arena" && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ArenaView
              members={members}
              transcript={transcript}
              topic={session?.topic || ""}
              activeSpeaker={activeSpeaker}
              onToggleMute={handleToggleMute}
              onEditMember={(m) => setEditingMember(m)}
              onRetrySpeaker={(name) => startStream("rounds", { rounds: 1 })}
              onOpenKeys={() => setIsKeysOpen(true)}
              onNewDebate={() => setIsNewDebateOpen(true)}
            />
            <Composer
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onRunRound={(rounds) => startStream("rounds", { rounds })}
              onRunSummary={() => startStream("summary", {})}
              onRunModerator={() => startStream("moderator", {})}
              onStop={abortStream}
              onSave={handleSaveSession}
              hasChair={hasChair}
            />
          </div>
        )}
      </div>

      {/* Redesigned Cost Footer */}
      <CostFooter
        inputTokens={totals.inputTokens}
        outputTokens={totals.outputTokens}
        totalCostUsd={totals.totalCostUsd}
        isCostEstimated={totals.isEstimated}
        isStreaming={isStreaming}
        activeSpeaker={activeSpeaker}
      />

      {/* Modals & Slide-over Sheets */}
      <NewDebateModal
        isOpen={isNewDebateOpen}
        onClose={() => setIsNewDebateOpen(false)}
        onStartDebate={handleStartNewDebate}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onResumeSession={handleResumeSession}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => {
          fetchConfig().then((cfg) => {
            // refresh
          }).catch(console.error);
        }}
      />

      <EditMemberModal
        member={editingMember}
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveMemberEdit}
      />

      <ApiKeysModal
        isOpen={isKeysOpen}
        onClose={() => setIsKeysOpen(false)}
        onKeysUpdated={checkKeys}
      />
    </div>
  );
}

export default App;
