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
import { Icon } from "./components/Icon";
import { StatusPill } from "./components/StatusPill";
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
    <div className="flex flex-col h-screen bg-canvas text-text-primary overflow-hidden font-sans transition-colors duration-150">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2 bg-surface-1 border border-strong text-text-primary text-[12px] font-mono rounded-pill shadow-none flex items-center gap-2 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
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
          <div className="absolute top-3 left-4 right-4 z-20 px-4 py-2.5 rounded-[12px] bg-surface-1 border border-strong text-[13px] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-text-secondary">
              <Icon name="key-round" size={16} />
              <span>No API keys configured yet. Add provider keys to start running debate rounds.</span>
            </div>
            <button
              onClick={() => setIsKeysOpen(true)}
              className="h-8 px-3 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover text-[12px] font-medium transition-colors duration-150 shrink-0 ml-3"
            >
              Configure keys
            </button>
          </div>
        )}

        {/* Long-form Deliberation thread mode */}
        {direction === "thread" && (
          <div className="flex-1 flex overflow-hidden">
            <MemberSidebar
              members={members}
              activeSpeaker={activeSpeaker}
              onToggleMute={handleToggleMute}
              onEditMember={(m) => setEditingMember(m)}
            />
            <main className="flex-1 flex flex-col min-w-0 bg-canvas">
              <TranscriptView
                transcript={transcript}
                topic={session?.topic || ""}
                onRetrySpeaker={() => startStream("rounds", { rounds: 1 })}
                onOpenKeys={() => setIsKeysOpen(true)}
                onNewDebate={() => setIsNewDebateOpen(true)}
              />
              <Composer
                isStreaming={isStreaming}
                activeSpeaker={activeSpeaker}
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

        {/* Workbench mode */}
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
              onRetrySpeaker={() => startStream("rounds", { rounds: 1 })}
              onOpenKeys={() => setIsKeysOpen(true)}
              onNewDebate={() => setIsNewDebateOpen(true)}
            />
            <Composer
              isStreaming={isStreaming}
              activeSpeaker={activeSpeaker}
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

        {/* Spatial Roundtable mode */}
        {direction === "arena" && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ArenaView
              members={members}
              transcript={transcript}
              topic={session?.topic || ""}
              activeSpeaker={activeSpeaker}
              onToggleMute={handleToggleMute}
              onEditMember={(m) => setEditingMember(m)}
              onRetrySpeaker={() => startStream("rounds", { rounds: 1 })}
              onOpenKeys={() => setIsKeysOpen(true)}
              onNewDebate={() => setIsNewDebateOpen(true)}
            />
            <Composer
              isStreaming={isStreaming}
              activeSpeaker={activeSpeaker}
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
          fetchConfig().catch(console.error);
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
