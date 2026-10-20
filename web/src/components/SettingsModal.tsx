import React, { useState, useEffect } from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import { CouncilConfig, ApiKeysState, getMemberTone } from "../types";
import {
  fetchConfig,
  saveConfig,
  fetchPrices,
  savePrices,
  fetchApiKeys,
  saveApiKeys,
  testApiKey,
} from "../api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

type SettingsSection = "members" | "runtime" | "prices" | "keys";

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", env: "ANTHROPIC_API_KEY", placeholder: "sk-ant-api03-…" },
  { id: "openai", name: "OpenAI", env: "OPENAI_API_KEY", placeholder: "sk-proj-…" },
  { id: "gemini", name: "Google Gemini", env: "GEMINI_API_KEY", placeholder: "AIzaSy…" },
  { id: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY", placeholder: "sk-or-v1-…" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("members");
  const [config, setConfig] = useState<CouncilConfig | null>(null);
  const [prices, setPrices] = useState<Record<string, [number, number]>>({});
  const [keysState, setKeysState] = useState<ApiKeysState>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { testing?: boolean; ok?: boolean; error?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConfig().then(setConfig).catch(console.error);
      fetchPrices().then(setPrices).catch(console.error);
      fetchApiKeys().then(setKeysState).catch(console.error);
      setKeyInputs({});
      setTestResults({});
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await saveConfig(config);
      await savePrices(prices);

      // Save keys if any changed
      const keyPayload: Record<string, string> = {};
      for (const [provider, val] of Object.entries(keyInputs)) {
        if (val.trim()) {
          keyPayload[provider] = val.trim();
        }
      }
      if (Object.keys(keyPayload).length > 0) {
        const res = await saveApiKeys(keyPayload);
        setKeysState(res.keys);
        setKeyInputs({});
      }

      setStatusMessage("Settings and configurations saved successfully.");
      onConfigSaved();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleMemberChange = (idx: number, field: string, val: any) => {
    const updated = [...config.members];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, members: updated });
  };

  const handleSelectChair = (chairIdx: number) => {
    const updated = config.members.map((m, i) => ({
      ...m,
      chair: i === chairIdx,
    }));
    setConfig({ ...config, members: updated });
  };

  const handleAddMember = () => {
    const number = config.members.length + 1;
    const newMember = {
      name: `Debater ${number}`,
      provider: "openrouter",
      model: "openai/gpt-4o-mini",
      role: "A focused perspective added for this debate.",
      chair: false,
      muted: false,
    };
    setConfig({ ...config, members: [...config.members, newMember] });
  };

  const handleRemoveMember = (idx: number) => {
    if (config.members.length <= 2) return;
    const updated = config.members.filter((_, i) => i !== idx);
    setConfig({ ...config, members: updated });
  };

  const handleTestKey = async (provider: string) => {
    if (keyInputs[provider]?.trim()) {
      await saveApiKeys({ [provider]: keyInputs[provider].trim() });
      const refreshed = await fetchApiKeys();
      setKeysState(refreshed);
    }
    setTestResults((prev) => ({ ...prev, [provider]: { testing: true } }));
    try {
      const res = await testApiKey(provider);
      if (res.status === "ok") {
        setTestResults((prev) => ({ ...prev, [provider]: { ok: true } }));
      } else {
        setTestResults((prev) => ({ ...prev, [provider]: { ok: false, error: res.error || "Failed test call" } }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [provider]: { ok: false, error: err.message } }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      {/* Dialog container: surface-1, 16px radius, fixed height with internal scroll */}
      <div className="w-full max-w-3xl h-[620px] max-h-[90vh] bg-surface-1 border border-subtle rounded-[16px] flex flex-col shadow-none overflow-hidden transition-colors duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-subtle flex items-center justify-between bg-surface-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">•</span>
            <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary">
              Council Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
            title="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Main Body: Left Section Nav + Right Fixed-Height Content Scroll Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left section nav: Members, Runtime, Prices, Keys */}
          <nav className="w-48 border-r border-subtle bg-surface-1 p-3 flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveSection("members")}
              className={`w-full text-left px-3 py-2 rounded-pill text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-2.5 ${
                activeSection === "members"
                  ? "bg-surface-3 text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              <Icon name="users" size={16} />
              <span>Members</span>
            </button>

            <button
              onClick={() => setActiveSection("runtime")}
              className={`w-full text-left px-3 py-2 rounded-pill text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-2.5 ${
                activeSection === "runtime"
                  ? "bg-surface-3 text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              <Icon name="sliders" size={16} />
              <span>Runtime</span>
            </button>

            <button
              onClick={() => setActiveSection("prices")}
              className={`w-full text-left px-3 py-2 rounded-pill text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-2.5 ${
                activeSection === "prices"
                  ? "bg-surface-3 text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              <Icon name="dollar-sign" size={16} />
              <span>Prices</span>
            </button>

            <button
              onClick={() => setActiveSection("keys")}
              className={`w-full text-left px-3 py-2 rounded-pill text-[13px] leading-[18px] font-medium transition-colors duration-150 flex items-center gap-2.5 ${
                activeSection === "keys"
                  ? "bg-surface-3 text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              <Icon name="key-round" size={16} />
              <span>API Keys</span>
            </button>
          </nav>

          {/* Right Content Area: Fixed height with internal scroll */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-surface-1">
            {/* 1. Members Section */}
            {activeSection === "members" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                      Council Members & Personas ({config.members.length})
                    </h4>
                    <p className="text-[13px] leading-[18px] text-text-secondary">
                      Configure individual personas and select exactly one chair.
                    </p>
                  </div>
                  <button
                    onClick={handleAddMember}
                    className="h-8 px-3 rounded-pill bg-btn-secondary-bg hover:bg-btn-secondary-hover border border-subtle text-text-primary text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5"
                  >
                    <Icon name="plus" size={14} />
                    <span>Add member</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {config.members.map((m, idx) => {
                    const tone = getMemberTone(m.name, m.chair);
                    const getToneColor = () => {
                      switch (tone) {
                        case "chair":
                          return "var(--member-chair)";
                        case "skeptic":
                          return "var(--member-skeptic)";
                        case "builder":
                          return "var(--member-builder)";
                        case "visionary":
                          return "var(--member-visionary)";
                        default:
                          return "var(--member-builder)";
                      }
                    };

                    return (
                      <div
                        key={idx}
                        style={{
                          borderLeftColor: getToneColor(),
                          borderLeftWidth: "2px",
                        }}
                        className="p-3.5 bg-surface-2 border border-subtle rounded-[12px] space-y-3 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                            placeholder="Member name"
                            className="font-semibold text-text-primary bg-transparent border-b border-subtle focus:border-strong focus:outline-none px-1 py-0.5 text-[14px]"
                          />
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer">
                              <input
                                type="radio"
                                name="chair-select"
                                checked={m.chair || false}
                                onChange={() => handleSelectChair(idx)}
                                className="accent-accent-warning"
                              />
                              <span className="text-[12px] font-medium">Chair</span>
                            </label>

                            <button
                              onClick={() => handleRemoveMember(idx)}
                              disabled={config.members.length <= 2}
                              className="p-1 rounded-pill text-text-tertiary hover:text-accent-danger disabled:opacity-30 transition-colors duration-150"
                              title="Remove member"
                            >
                              <Icon name="trash-2" size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-mono text-text-tertiary block mb-1">
                              PROVIDER
                            </label>
                            <select
                              value={m.provider}
                              onChange={(e) => handleMemberChange(idx, "provider", e.target.value)}
                              className="w-full bg-surface-1 border border-subtle rounded-btn p-2 text-text-primary text-[13px] focus:outline-none focus:border-strong"
                            >
                              <option value="anthropic">Anthropic</option>
                              <option value="openai">OpenAI</option>
                              <option value="gemini">Google Gemini</option>
                              <option value="openrouter">OpenRouter</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-text-tertiary block mb-1">
                              MODEL ID
                            </label>
                            <input
                              type="text"
                              value={m.model}
                              onChange={(e) => handleMemberChange(idx, "model", e.target.value)}
                              className="w-full bg-surface-1 border border-subtle rounded-btn p-2 text-text-primary font-mono text-[12px] focus:outline-none focus:border-strong"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-mono text-text-tertiary block mb-1">
                            PERSPECTIVE & ROLE
                          </label>
                          <input
                            type="text"
                            value={m.role}
                            onChange={(e) => handleMemberChange(idx, "role", e.target.value)}
                            className="w-full bg-surface-1 border border-subtle rounded-btn p-2 text-text-primary text-[13px] focus:outline-none focus:border-strong"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Runtime Section */}
            {activeSection === "runtime" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                    Runtime Constraints & Rules
                  </h4>
                  <p className="text-[13px] leading-[18px] text-text-secondary">
                    Configure length bounds and overarching system prompts.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                      Words per turn
                    </label>
                    <select
                      value={config.settings.words}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: { ...config.settings, words: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-text-primary text-[13px] focus:outline-none focus:border-strong"
                    >
                      <option value={80}>80 words · concise</option>
                      <option value={120}>120 words · balanced</option>
                      <option value={200}>200 words · detailed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                      Lookback window (entries)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={config.settings.window}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: { ...config.settings, window: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-text-primary font-mono text-[13px] focus:outline-none focus:border-strong"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                    Debate system constraints & rules
                  </label>
                  <textarea
                    rows={5}
                    value={config.settings.rules}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: { ...config.settings, rules: e.target.value },
                      })
                    }
                    className="w-full bg-surface-2 border border-subtle rounded-btn p-3 text-text-primary font-mono text-[12px] leading-[18px] focus:outline-none focus:border-strong"
                  />
                </div>
              </div>
            )}

            {/* 3. Prices Section */}
            {activeSection === "prices" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                    Pricing Table
                  </h4>
                  <p className="text-[13px] leading-[18px] text-text-secondary">
                    Model price overrides per 1,000,000 tokens (saved to <code>~/.config/council/prices.toml</code>):
                  </p>
                </div>

                <div className="border border-subtle rounded-[12px] overflow-hidden bg-surface-2">
                  <div className="grid grid-cols-3 p-3 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary border-b border-subtle">
                    <span>Model</span>
                    <span>Input / 1M ($)</span>
                    <span>Output / 1M ($)</span>
                  </div>
                  <div className="divide-y divide-subtle">
                    {Object.entries(prices).map(([model, [inPrice, outPrice]]) => (
                      <div key={model} className="grid grid-cols-3 items-center p-3 text-[13px]">
                        <span className="text-text-primary font-mono text-[12px] truncate mr-2">
                          {model}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-text-tertiary font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={inPrice}
                            onChange={(e) =>
                              setPrices({
                                ...prices,
                                [model]: [Number(e.target.value), outPrice],
                              })
                            }
                            className="w-24 bg-surface-1 border border-subtle rounded-btn p-1.5 text-right font-mono text-[12px] text-text-primary focus:outline-none focus:border-strong"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-text-tertiary font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={outPrice}
                            onChange={(e) =>
                              setPrices({
                                ...prices,
                                [model]: [inPrice, Number(e.target.value)],
                              })
                            }
                            className="w-24 bg-surface-1 border border-subtle rounded-btn p-1.5 text-right font-mono text-[12px] text-text-primary focus:outline-none focus:border-strong"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Keys Section */}
            {activeSection === "keys" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[14px] leading-[20px] font-semibold text-text-primary">
                    Provider API Keys
                  </h4>
                  <p className="text-[13px] leading-[18px] text-text-secondary">
                    Stored securely in <code>~/.config/council/keys.json</code> (permissions 0600).
                  </p>
                </div>

                <div className="space-y-3">
                  {PROVIDERS.map((prov) => {
                    const current = keysState[prov.id];
                    const isConfigured = current?.is_set;
                    const preview = current?.preview;
                    const isTesting = testResults[prov.id]?.testing;
                    const testResult = testResults[prov.id];

                    return (
                      <div
                        key={prov.id}
                        className="p-3.5 rounded-[12px] bg-surface-2 border border-subtle space-y-2.5 transition-colors duration-150"
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

                          <StatusPill
                            variant={isConfigured ? "success" : "neutral"}
                            label={isConfigured ? `Configured: ${preview}` : "Not Set"}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showKey[prov.id] ? "text" : "password"}
                              value={keyInputs[prov.id] || ""}
                              onChange={(e) =>
                                setKeyInputs((prev) => ({ ...prev, [prov.id]: e.target.value }))
                              }
                              placeholder={isConfigured ? "Paste new key to replace…" : prov.placeholder}
                              className="w-full bg-surface-1 border border-subtle rounded-btn pl-3 pr-9 py-2 text-[12px] font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-strong"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowKey((prev) => ({ ...prev, [prov.id]: !prev[prov.id] }))
                              }
                              className="absolute right-2.5 top-2.5 text-text-tertiary hover:text-text-primary"
                            >
                              <Icon name={showKey[prov.id] ? "eye-off" : "eye"} size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTestKey(prov.id)}
                            disabled={!isConfigured && !keyInputs[prov.id]}
                            className="h-9 px-3 rounded-pill bg-btn-secondary-bg hover:bg-btn-secondary-hover border border-subtle text-text-primary text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                          >
                            <Icon name="refresh-cw" size={14} className={isTesting ? "animate-spin" : ""} />
                            <span>{isTesting ? "Testing" : "Test"}</span>
                          </button>
                        </div>

                        {testResult && !isTesting && (
                          <div className="pt-0.5">
                            {testResult.ok ? (
                              <span className="text-[12px] text-accent-success flex items-center gap-1.5 font-mono">
                                <Icon name="circle-check" size={14} />
                                <span>Verified successfully.</span>
                              </span>
                            ) : (
                              <span className="text-[12px] text-accent-danger flex items-start gap-1.5 font-mono">
                                <Icon name="circle-alert" size={14} className="shrink-0 mt-0.5" />
                                <span>{testResult.error}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: 40px dialog buttons */}
        <div className="h-16 px-6 border-t border-subtle flex items-center justify-between bg-surface-1 shrink-0">
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
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="h-10 px-5 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-40 text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            >
              <span>{saving ? "Saving…" : "Save settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
