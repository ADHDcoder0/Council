import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-surface-1 border border-subtle rounded-[16px] flex flex-col shadow-none overflow-hidden max-h-[92vh] transition-colors duration-150">
        {/* Header */}
        <div className="h-16 px-6 border-b border-subtle flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">•</span>
            <div>
              <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary">
                Provider API Keys
              </h3>
              <p className="text-[12px] leading-[16px] text-text-secondary">
                Configure local keys for direct LLM invocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Security / Privacy notice */}
        <div className="px-6 py-2.5 bg-surface-2 border-b border-subtle flex items-center gap-2 text-[12px] leading-[16px] font-mono text-text-tertiary">
          <span>
            Held locally in <code>~/.config/council/keys.json</code> (permissions 0600).
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
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
                className="p-3.5 rounded-[12px] bg-surface-2 border border-subtle space-y-2.5 hover:border-strong transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px] text-text-primary">
                      {prov.name}
                    </span>
                    <span className="font-mono text-[11px] text-text-tertiary">
                      {prov.env}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill
                      variant={isConfigured ? "success" : "neutral"}
                      label={isConfigured ? `Configured: ${preview}` : "Not Set"}
                    />
                    <a
                      href={prov.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] text-text-secondary hover:text-text-primary hover:underline"
                    >
                      Docs
                    </a>
                  </div>
                </div>

                {/* Input field + show/hide */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey[prov.id] ? "text" : "password"}
                      value={inputValues[prov.id] || ""}
                      onChange={(e) => handleInputChange(prov.id, e.target.value)}
                      placeholder={isConfigured ? "Paste new key to replace…" : prov.placeholder}
                      className="w-full bg-surface-1 border border-subtle rounded-btn pl-3 pr-9 py-2 text-[12px] font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-strong"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(prov.id)}
                      className="absolute right-2.5 top-2.5 text-text-tertiary hover:text-text-primary"
                    >
                      <Icon name={showKey[prov.id] ? "eye-off" : "eye"} size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestKey(prov.id)}
                    disabled={!isConfigured && !inputValues[prov.id]}
                    className="h-9 px-3 rounded-pill bg-btn-secondary-bg hover:bg-btn-secondary-hover border border-subtle text-text-primary text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                    title="Run quick test call"
                  >
                    <Icon name="refresh-cw" size={14} className={isTesting ? "animate-spin" : ""} />
                    <span>{isTesting ? "Testing" : "Test"}</span>
                  </button>
                </div>

                {/* Test feedback */}
                {testResult && !isTesting && (
                  <div className="pt-0.5">
                    {testResult.ok ? (
                      <span className="text-[12px] text-accent-success flex items-center gap-1.5 font-mono">
                        <Icon name="circle-check" size={14} />
                        <span>Authentication verified.</span>
                      </span>
                    ) : (
                      <span className="text-[12px] text-accent-danger flex items-start gap-1.5 font-mono">
                        <Icon name="circle-alert" size={14} className="shrink-0 mt-0.5" />
                        <span className="break-all">{testResult.error}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: 40px buttons */}
        <div className="h-16 px-6 border-t border-subtle flex items-center justify-between bg-surface-1">
          <div>
            {statusMessage && (
              <span className={`text-[12px] font-mono ${statusMessage.startsWith("Error") ? "text-accent-danger" : "text-accent-success"}`}>
                {statusMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-pill border border-subtle bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[13px] font-medium transition-colors duration-150"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-5 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-40 text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            >
              <span>{saving ? "Saving…" : "Save keys"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
