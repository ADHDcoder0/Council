import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { MemberSidebar } from "./components/MemberSidebar";
import { TranscriptView } from "./components/TranscriptView";
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
} from "./api";
import { MemberInfo, SessionResponse, TranscriptEntry } from "./types";
import { Key } from "lucide-react";

export function App() {
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
          "Should engineers choose a modular monolith or microservices by default?",
          120,
          1
        );
        setSession(s);
        setTranscript(s.transcript);
        setMembers(s.members);
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
      setMembers(s.members);
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
      const updated = await addMessage(session.session_id, "User", text);
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
      setMembers(s.members);
      setTotals({
        inputTokens: s.total_input_tokens,
        outputTokens: s.total_output_tokens,
        totalCostUsd: s.total_cost_usd,
        isEstimated: s.is_cost_estimated,
      });
      showToast(`Resumed session: ${s.topic}`);
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
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg shadow-xl animate-fade-in flex items-center space-x-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        topic={session?.topic || ""}
        sessionId={session?.session_id || null}
        onNewDebate={() => setIsNewDebateOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenKeys={() => setIsKeysOpen(true)}
        onExport={handleExport}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Members */}
        <MemberSidebar
          members={members}
          activeSpeaker={activeSpeaker}
          onToggleMute={handleToggleMute}
          onEditMember={(m) => setEditingMember(m)}
        />

        {/* Center: Transcript + Composer */}
        <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
          {!hasAnyKey && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 flex items-center justify-between text-xs text-amber-200 shrink-0">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No API keys configured yet. Enter your Anthropic, OpenAI, Gemini, or OpenRouter keys to start debating.</span>
              </div>
              <button
                onClick={() => setIsKeysOpen(true)}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition shrink-0 ml-3 shadow-sm"
              >
                Enter Keys
              </button>
            </div>
          )}

          <TranscriptView
            transcript={transcript}
            topic={session?.topic || ""}
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

      {/* Bottom Cost and Token Footer */}
      <CostFooter
        inputTokens={totals.inputTokens}
        outputTokens={totals.outputTokens}
        totalCostUsd={totals.totalCostUsd}
        isCostEstimated={totals.isEstimated}
        isStreaming={isStreaming}
        activeSpeaker={activeSpeaker}
      />

      {/* Modals & Drawers */}
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
          // reload current config
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
