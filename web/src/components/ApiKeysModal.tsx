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
    placeholder: "sk-ant-api03-...",
    docUrl: "https://console.anthropic.com/settings/keys",
    color: "text-amber-400",
    badgeBg: "bg-amber-950/70 border-amber-800 text-amber-300",
  },
  {
    id: "openai",
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    placeholder: "sk-proj-...",
    docUrl: "https://platform.openai.com/api-keys",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-950/70 border-emerald-800 text-emerald-300",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    env: "GEMINI_API_KEY",
    placeholder: "AIzaSy...",
    docUrl: "https://aistudio.google.com/app/apikey",
    color: "text-sky-400",
    badgeBg: "bg-sky-950/70 border-sky-800 text-sky-300",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    env: "OPENROUTER_API_KEY",
    placeholder: "sk-or-v1-...",
    docUrl: "https://openrouter.ai/keys",
    color: "text-purple-400",
    badgeBg: "bg-purple-950/70 border-purple-800 text-purple-300",
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
      // Send only providers that have non-empty input
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
      setStatusMessage("API keys saved and loaded into Council environment.");
      if (onKeysUpdated) onKeysUpdated();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Error saving keys: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async (provider: string) => {
    // If user typed a new key without saving, save it first
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Provider API Keys</h3>
              <p className="text-[11px] text-zinc-400">
                Configure your API keys for Council debaters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center space-x-2 text-[11px] text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Keys are saved locally in <code className="text-zinc-300 font-mono">~/.config/council/keys.json</code> (permissions 0600) and never transmitted to any third party.
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {PROVIDER_METADATA.map((prov) => {
            const current = keysState[prov.id];
            const isConfigured = current?.is_set;
            const preview = current?.preview;
            const isTesting = testResults[prov.id]?.testing;
            const testResult = testResults[prov.id];

            return (
              <div
                key={prov.id}
                className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-2 hover:border-zinc-700/80 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${prov.color} text-sm`}>
                      {prov.name}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      ({prov.env})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isConfigured ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        <span>Configured: {preview}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-medium">
                        Not set
                      </span>
                    )}

                    <a
                      href={prov.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      title="Get API key from provider console"
                    >
                      Get Key
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
                      placeholder={isConfigured ? "Paste new key to replace..." : prov.placeholder}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(prov.id)}
                      className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
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
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 text-xs font-medium transition shrink-0"
                    title="Run quick 1-word test call"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin text-indigo-400" : ""}`} />
                    <span>Test</span>
                  </button>
                </div>

                {/* Test feedback */}
                {testResult && !isTesting && (
                  <div className="pt-1">
                    {testResult.ok ? (
                      <span className="text-[11px] text-emerald-400 flex items-center space-x-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>API key verified successfully. Model responded!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-red-400 flex items-start space-x-1 font-mono">
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
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div>
            {statusMessage && (
              <span className={`text-xs ${statusMessage.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {statusMessage}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Keys"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
