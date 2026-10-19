import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { MemberInfo } from "../types";

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

  const [model, setModel] = useState(member.model);
  const [role, setRole] = useState(member.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member.name, { model, role });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-sm text-white">Edit Persona: {member.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Role & Perspective</label>
            <textarea
              rows={4}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100 focus:outline-none focus:border-indigo-500 leading-relaxed text-xs"
            />
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
