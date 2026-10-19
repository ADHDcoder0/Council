import React, { useState, useEffect } from "react";
import { X, Key, Check, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { ApiKeysState } from "../types";
import { fetchApiKeys, saveApiKeys, testApiKey } from "../api";

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

const PROVIDER_METADATA = [
  {
    id: "anthropic",
    name: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    placeholder: "sk-ant-api03-…",
    docUrl: "https://console.anthropic.com/settings/keys",
    toneColor: "var(--member-skeptic)",
  },
  {
    id: "openai",
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    placeholder: "sk-proj-…",
    docUrl: "https://platform.openai.com/api-keys",
    toneColor: "var(--member-builder)",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    env: "GEMINI_API_KEY",
    placeholder: "AIzaSy…",
    docUrl: "https://aistudio.google.com/app/apikey",
    toneColor: "var(--member-visionary)",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    env: "OPENROUTER_API_KEY",
    placeholder: "sk-or-v1-…",
    docUrl: "https://openrouter.ai/keys",
    toneColor: "var(--member-chair)",
  },
];

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [keysState, setKeysState] = useState<ApiKeysState>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { testing?: boolean; ok?: boolean; error?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const data = await fetchApiKeys();
      setKeysState(data);
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKeys();
      setInputValues({});
      setTestResults({});
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (provider: string, val: string) => {
    setInputValues((prev) => ({ ...prev, [provider]: val }));
  };

  const toggleShow = (provider: string) => {
    setShowKey((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload: Record<string, string> = {};
      for (const [provider, val] of Object.entries(inputValues)) {
        if (val.trim()) {
          payload[provider] = val.trim();
        }
      }

      if (Object.keys(payload).length === 0) {
        setStatusMessage("No key changes to save.");
        setSaving(false);
        return;
      }

      const res = await saveApiKeys(payload);
      setKeysState(res.keys);
      setInputValues({});
      setStatusMessage("API keys saved successfully to ~/.config/council/keys.json.");
      if (onKeysUpdated) onKeysUpdated();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Error saving keys: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async (provider: string) => {
    if (inputValues[provider]?.trim()) {
      await saveApiKeys({ [provider]: inputValues[provider].trim() });
      await loadKeys();
    }

    setTestResults((prev) => ({
      ...prev,
      [provider]: { testing: true },
    }));

    try {
      const res = await testApiKey(provider);
      if (res.status === "ok") {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { ok: true },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { ok: false, error: res.error || "Failed test call" },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { ok: false, error: err.message },
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] rounded-xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-[var(--council-border)] flex items-center justify-between bg-[var(--council-surface-2)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-[var(--council-surface-3)] border border-[var(--council-border)] text-[var(--council-accent)]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--council-text)]">
                Provider API keys
              </h3>
              <p className="text-[11px] text-[var(--council-text-muted)]">
                Configure access for each LLM provider.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security / Privacy notice */}
        <div className="px-4 py-2.5 bg-[var(--council-surface-2)] border-b border-[var(--council-border)] flex items-center space-x-2 text-[11px] text-[var(--council-text-muted)]">
          <Lock className="w-3.5 h-3.5 text-[var(--council-accent)] shrink-0" />
          <span>
            Keys are held locally in <code className="text-[var(--council-text)] font-mono">~/.config/council/keys.json</code> (permissions 0600) and never shared.
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {PROVIDER_METADATA.map((prov) => {
            const current = keysState[prov.id];
            const isConfigured = current?.is_set;
            const preview = current?.preview;
            const isTesting = testResults[prov.id]?.testing;
            const testResult = testResults[prov.id];

            return (
              <div
                key={prov.id}
                style={{
                  borderLeftColor: prov.toneColor,
                  borderLeftWidth: "2px",
                }}
                className="p-3.5 rounded-lg bg-[var(--council-surface-2)] border border-[var(--council-border)] space-y-2 hover:border-[var(--council-border-strong)] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-[var(--council-text)]">
                      {prov.name}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--council-text-faint)]">
                      {prov.env}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isConfigured ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--council-success-bg)] text-[var(--council-accent)] font-mono font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        <span>Configured: {preview}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--council-surface-3)] text-[var(--council-text-faint)] font-mono">
                        Not set
                      </span>
                    )}

                    <a
                      href={prov.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[var(--council-accent)] hover:underline"
                    >
                      Get key
                    </a>
                  </div>
                </div>

                {/* Input field + show/hide */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey[prov.id] ? "text" : "password"}
                      value={inputValues[prov.id] || ""}
                      onChange={(e) => handleInputChange(prov.id, e.target.value)}
                      placeholder={isConfigured ? "Paste new key to replace…" : prov.placeholder}
                      className="w-full bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded-md pl-3 pr-9 py-1.5 text-xs text-[var(--council-text)] placeholder-[var(--council-text-faint)] focus:outline-none focus:border-[var(--council-accent)] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(prov.id)}
                      className="absolute right-2.5 top-2 text-[var(--council-text-faint)] hover:text-[var(--council-text)]"
                    >
                      {showKey[prov.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestKey(prov.id)}
                    disabled={!isConfigured && !inputValues[prov.id]}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-1)] hover:bg-[var(--council-surface-hover)] disabled:opacity-40 text-[var(--council-text)] text-xs font-medium transition shrink-0"
                    title="Run quick 1-word test call"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin text-[var(--council-accent)]" : ""}`} />
                    <span>{isTesting ? "Testing" : "Test"}</span>
                  </button>
                </div>

                {/* Test feedback */}
                {testResult && !isTesting && (
                  <div className="pt-0.5">
                    {testResult.ok ? (
                      <span className="text-[11px] text-[var(--council-accent)] flex items-center space-x-1 font-medium font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Provider authentication verified.</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--council-danger)] flex items-start space-x-1 font-mono">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="break-all">{testResult.error}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--council-border)] flex items-center justify-between bg-[var(--council-surface-2)]">
          <div>
            {statusMessage && (
              <span className={`text-xs ${statusMessage.startsWith("Error") ? "text-[var(--council-danger)]" : "text-[var(--council-accent)]"}`}>
                {statusMessage}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-1)] hover:bg-[var(--council-surface-hover)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-md bg-[var(--council-accent)] hover:opacity-90 disabled:opacity-50 text-[var(--bg-canvas)] text-xs font-semibold transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? "Saving…" : "Save keys"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
