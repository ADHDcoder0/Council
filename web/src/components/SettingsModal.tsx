import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Sliders, Users, DollarSign, Crown } from "lucide-react";
import { CouncilConfig, getMemberTone } from "../types";
import { fetchConfig, saveConfig, fetchPrices, savePrices } from "../api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [activeTab, setActiveTab] = useState<"runtime" | "members" | "prices">("runtime");
  const [config, setConfig] = useState<CouncilConfig | null>(null);
  const [prices, setPrices] = useState<Record<string, [number, number]>>({});
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConfig().then(setConfig).catch(console.error);
      fetchPrices().then(setPrices).catch(console.error);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const handleSaveConfig = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await saveConfig(config);
      await savePrices(prices);
      setStatusMessage("Settings and pricing saved successfully.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] rounded-xl flex flex-col shadow-2xl max-h-[90vh] overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-[var(--council-border)] flex items-center justify-between bg-[var(--council-surface-2)]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[var(--council-accent)]" />
            <h3 className="font-semibold text-sm text-[var(--council-text)]">
              Council settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--council-border)] px-4 bg-[var(--council-surface-2)]">
          <button
            onClick={() => setActiveTab("runtime")}
            className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === "runtime"
                ? "border-[var(--council-accent)] text-[var(--council-text)] font-semibold"
                : "border-transparent text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rules & Runtime</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === "members"
                ? "border-[var(--council-accent)] text-[var(--council-text)] font-semibold"
                : "border-transparent text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members & Personas ({config.members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("prices")}
            className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === "prices"
                ? "border-[var(--council-accent)] text-[var(--council-text)] font-semibold"
                : "border-transparent text-[var(--council-text-muted)] hover:text-[var(--council-text)]"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pricing Table</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === "runtime" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-xs text-[var(--council-text)]">
                  Rules and runtime
                </span>
                <p className="text-[11px] text-[var(--council-text-muted)]">
                  Set response limits and shared debate constraints.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[var(--council-text)] font-medium mb-1">
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
                    className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] focus:outline-none focus:border-[var(--council-accent)]"
                  >
                    <option value={80}>80 words · concise</option>
                    <option value={120}>120 words · balanced</option>
                    <option value={200}>200 words · detailed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--council-text)] font-medium mb-1">
                    Prompt window (lookback entries)
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
                    className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] focus:outline-none focus:border-[var(--council-accent)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--council-text)] font-medium mb-1">
                  Debate rules & system constraints
                </label>
                <textarea
                  rows={4}
                  value={config.settings.rules}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: { ...config.settings, rules: e.target.value },
                    })
                  }
                  className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2.5 text-[var(--council-text)] focus:outline-none focus:border-[var(--council-accent)] leading-relaxed font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[var(--council-text)] block">
                    Members and personas
                  </span>
                  <p className="text-[11px] text-[var(--council-text-muted)]">
                    Configure debaters and select exactly one chair.
                  </p>
                </div>
                <button
                  onClick={handleAddMember}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] border border-[var(--council-border)] text-[var(--council-text)] text-xs font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
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
                      className="p-3 bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-lg space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                          placeholder="Member name"
                          className="font-semibold text-[var(--council-text)] bg-transparent border-b border-[var(--council-border)] focus:border-[var(--council-accent)] focus:outline-none px-1 py-0.5 text-xs"
                        />
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-1 text-[var(--council-text-muted)] cursor-pointer">
                            <input
                              type="radio"
                              name="chair-select"
                              checked={m.chair || false}
                              onChange={() => handleSelectChair(idx)}
                              className="accent-[var(--council-accent)]"
                            />
                            <span className="text-[11px] font-medium flex items-center space-x-0.5">
                              <Crown className="w-3 h-3 text-[var(--council-warning)]" />
                              <span>Chair</span>
                            </span>
                          </label>

                          <button
                            onClick={() => handleRemoveMember(idx)}
                            disabled={config.members.length <= 2}
                            className="p-1 rounded text-[var(--council-text-muted)] hover:text-[var(--council-danger)] disabled:opacity-30 transition"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[var(--council-text-faint)] block mb-0.5">
                            Provider
                          </label>
                          <select
                            value={m.provider}
                            onChange={(e) => handleMemberChange(idx, "provider", e.target.value)}
                            className="w-full bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded p-1.5 text-[var(--council-text)] text-xs"
                          >
                            <option value="anthropic">Anthropic</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--council-text-faint)] block mb-0.5">
                            Model ID
                          </label>
                          <input
                            type="text"
                            value={m.model}
                            onChange={(e) => handleMemberChange(idx, "model", e.target.value)}
                            className="w-full bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded p-1.5 text-[var(--council-text)] font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-[var(--council-text-faint)] block mb-0.5">
                          Role & Perspective
                        </label>
                        <input
                          type="text"
                          value={m.role}
                          onChange={(e) => handleMemberChange(idx, "role", e.target.value)}
                          className="w-full bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded p-1.5 text-[var(--council-text)] text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "prices" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="font-semibold text-xs text-[var(--council-text)] block">
                  Pricing table
                </span>
                <p className="text-[11px] text-[var(--council-text-muted)]">
                  Override prices per 1,000,000 tokens (saved locally to <code>~/.config/council/prices.toml</code>):
                </p>
              </div>

              <div className="border border-[var(--council-border)] rounded-lg overflow-hidden bg-[var(--council-surface-2)]">
                <div className="grid grid-cols-3 p-2.5 font-mono text-[10px] uppercase text-[var(--council-text-faint)] border-b border-[var(--council-border)]">
                  <span>Model</span>
                  <span>Input / 1M ($)</span>
                  <span>Output / 1M ($)</span>
                </div>
                <div className="divide-y divide-[var(--council-border)]">
                  {Object.entries(prices).map(([model, [inPrice, outPrice]]) => (
                    <div key={model} className="grid grid-cols-3 items-center p-2 text-xs">
                      <code className="text-[var(--council-text)] font-mono truncate mr-2">
                        {model}
                      </code>
                      <div className="flex items-center space-x-1">
                        <span className="text-[var(--council-text-faint)]">$</span>
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
                          className="w-20 bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded p-1 text-right font-mono text-xs text-[var(--council-text)]"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[var(--council-text-faint)]">$</span>
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
                          className="w-20 bg-[var(--council-surface-1)] border border-[var(--council-border)] rounded p-1 text-right font-mono text-xs text-[var(--council-text)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-md bg-[var(--council-accent)] hover:opacity-90 disabled:opacity-50 text-[var(--bg-canvas)] text-xs font-semibold transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving…" : "Save settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
