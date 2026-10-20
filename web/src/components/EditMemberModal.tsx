import React, { useState } from "react";
import { Icon } from "./Icon";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-surface-1 border border-subtle rounded-[16px] flex flex-col shadow-none overflow-hidden transition-colors duration-150">
        <div className="h-14 px-6 border-b border-subtle flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getToneColor() }}
            />
            <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary">
              Edit Persona: {member.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-text-primary block mb-1.5">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-[13px] text-text-primary focus:outline-none focus:border-strong"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div>
            <label className="text-[13px] font-medium text-text-primary block mb-1.5">
              Model ID
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-text-primary font-mono text-[12px] focus:outline-none focus:border-strong"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-text-primary block mb-1.5">
              Role & Perspective
            </label>
            <textarea
              rows={4}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-[13px] leading-[18px] text-text-primary focus:outline-none focus:border-strong"
            />
          </div>

          <div className="pt-4 border-t border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-pill border border-subtle bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary text-[13px] font-medium transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            >
              <span>Apply changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
