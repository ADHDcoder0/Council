import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Sliders, Users, DollarSign } from "lucide-react";
import { CouncilConfig, MemberInfo } from "../types";
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
  const [activeTab, setActiveTab] = useState<"settings" | "members" | "pricing">("settings");
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

  const handleAddMember = () => {
    const newMember = {
      name: "Debater",
      provider: "openai",
      model: "gpt-4o",
      role: "Provides arguments and analysis.",
      chair: false,
      muted: false,
    };
    setConfig({ ...config, members: [...config.members, newMember] });
  };

  const handleRemoveMember = (idx: number) => {
    const updated = config.members.filter((_, i) => i !== idx);
    setConfig({ ...config, members: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm text-white">Council Settings & Personas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-4 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === "settings"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rules & Runtime</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === "members"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members & Personas ({config.members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === "pricing"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pricing Table</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "settings" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Words per turn ({config.settings.words} words)
                </label>
                <input
                  type="range"
                  min={30}
                  max={500}
                  step={10}
                  value={config.settings.words}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: { ...config.settings, words: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Prompt Window (lookback entries)
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Debate Rules & System Constraints
                </label>
                <textarea
                  rows={3}
                  value={config.settings.rules}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      settings: { ...config.settings, rules: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Configure council debaters and chair.</span>
                <button
                  onClick={handleAddMember}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="space-y-3">
                {config.members.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                        placeholder="Member name"
                        className="font-semibold text-white bg-transparent border-b border-zinc-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1 text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.chair || false}
                            onChange={(e) => handleMemberChange(idx, "chair", e.target.checked)}
                            className="rounded accent-amber-500"
                          />
                          <span className="text-[11px]">Chair</span>
                        </label>
                        <button
                          onClick={() => handleRemoveMember(idx)}
                          className="p-1 rounded text-red-400 hover:bg-zinc-800 transition"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500 block">Provider</label>
                        <select
                          value={m.provider}
                          onChange={(e) => handleMemberChange(idx, "provider", e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-300"
                        >
                          <option value="anthropic">Anthropic</option>
                          <option value="openai">OpenAI</option>
                          <option value="gemini">Gemini</option>
                          <option value="openrouter">OpenRouter</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 block">Model ID</label>
                        <input
                          type="text"
                          value={m.model}
                          onChange={(e) => handleMemberChange(idx, "model", e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block">Role / Persona</label>
                      <input
                        type="text"
                        value={m.role}
                        onChange={(e) => handleMemberChange(idx, "role", e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-3 text-xs">
              <p className="text-zinc-400">
                Override prices per 1,000,000 tokens (saved to <code>~/.config/council/prices.toml</code>):
              </p>
              <div className="space-y-2">
                {Object.entries(prices).map(([model, [inPrice, outPrice]]) => (
                  <div
                    key={model}
                    className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800 rounded"
                  >
                    <span className="font-mono text-zinc-300 truncate max-w-[200px]">{model}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-zinc-500">In: $</span>
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
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded p-0.5 text-right font-mono text-zinc-200"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-zinc-500">Out: $</span>
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
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded p-0.5 text-right font-mono text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/40">
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
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
