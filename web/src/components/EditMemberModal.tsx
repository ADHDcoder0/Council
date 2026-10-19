import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { MemberInfo, getMemberTone } from "../types";

interface EditMemberModalProps {
  member: MemberInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, updates: Partial<MemberInfo>) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !member) return null;

  const [provider, setProvider] = useState(member.provider);
  const [model, setModel] = useState(member.model);
  const [role, setRole] = useState(member.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member.name, { provider, model, role });
    onClose();
  };

  const tone = member.tone || getMemberTone(member.name, member.is_chair);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div
        style={{ borderTopColor: getToneColor(), borderTopWidth: "3px" }}
        className="w-full max-w-md bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] rounded-xl flex flex-col shadow-2xl overflow-hidden transition-colors"
      >
        <div className="p-4 border-b border-[var(--council-border)] flex items-center justify-between bg-[var(--council-surface-2)]">
          <div className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getToneColor() }}
            />
            <h3 className="font-semibold text-sm text-[var(--council-text)]">
              Edit Persona: {member.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="text-[var(--council-text-muted)] block mb-1 font-medium">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] text-xs focus:outline-none focus:border-[var(--council-accent)]"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div>
            <label className="text-[var(--council-text-muted)] block mb-1 font-medium">
              Model ID
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] focus:outline-none focus:border-[var(--council-accent)] font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-[var(--council-text-muted)] block mb-1 font-medium">
              Role & Perspective
            </label>
            <textarea
              rows={4}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] focus:outline-none focus:border-[var(--council-accent)] leading-relaxed text-xs"
            />
          </div>

          <div className="pt-2 border-t border-[var(--council-border)] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-[var(--council-accent)] hover:opacity-90 text-[var(--bg-canvas)] font-semibold transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
