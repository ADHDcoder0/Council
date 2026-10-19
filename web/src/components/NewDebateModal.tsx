import React, { useState } from "react";
import { X, Play, Sparkles } from "lucide-react";

interface NewDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDebate: (topic: string, words: number, rounds: number) => void;
}

const SAMPLE_TOPICS = [
  "Should engineering teams prefer a modular monolith over microservices by default?",
  "Will agent swarms make traditional workflow engines obsolete within 3 years?",
  "Is Rust’s borrow checker worth the productivity cost for startup MVPs?",
  "Should synthetic data be the default for local development and testing?",
];

export const NewDebateModal: React.FC<NewDebateModalProps> = ({
  isOpen,
  onClose,
  onStartDebate,
}) => {
  const [topic, setTopic] = useState("");
  const [words, setWords] = useState("120");
  const [rounds, setRounds] = useState("1");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStartDebate(topic.trim(), Number(words), Number(rounds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[var(--council-surface-1)] border border-[var(--council-border-strong)] rounded-xl flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-[var(--council-border)] flex items-center justify-between bg-[var(--council-surface-2)]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[var(--council-accent)]" />
            <h3 className="font-semibold text-sm text-[var(--council-text)]">
              Start a new Council debate
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--council-text-muted)] hover:text-[var(--council-text)] hover:bg-[var(--council-surface-3)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[var(--council-text)] font-medium mb-1.5">
              Topic or Question
            </label>
            <textarea
              required
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should the council deliberate?"
              className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-lg p-2.5 text-[var(--council-text)] placeholder-[var(--council-text-faint)] focus:outline-none focus:border-[var(--council-accent)] text-xs leading-relaxed"
            />
          </div>

          {/* Sample Topic Chips */}
          <div>
            <span className="text-[11px] text-[var(--council-text-muted)] block mb-1.5">
              Or pick an idea to explore:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {SAMPLE_TOPICS.map((t, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setTopic(t)}
                  className="text-left text-[11px] px-2.5 py-1.5 rounded bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] border border-[var(--council-border)] transition line-clamp-1"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[var(--council-text)] font-medium mb-1">
                Words per turn
              </label>
              <select
                value={words}
                onChange={(e) => setWords(e.target.value)}
                className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] text-xs focus:outline-none focus:border-[var(--council-accent)]"
              >
                <option value="80">80 words · concise</option>
                <option value="120">120 words · balanced</option>
                <option value="200">200 words · detailed</option>
              </select>
            </div>
            <div>
              <label className="block text-[var(--council-text)] font-medium mb-1">
                Initial rounds
              </label>
              <select
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                className="w-full bg-[var(--council-surface-2)] border border-[var(--council-border)] rounded-md p-2 text-[var(--council-text)] text-xs focus:outline-none focus:border-[var(--council-accent)]"
              >
                <option value="1">1 round</option>
                <option value="2">2 rounds</option>
                <option value="3">3 rounds</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--council-border)] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[var(--council-border)] bg-[var(--council-surface-2)] hover:bg-[var(--council-surface-hover)] text-[var(--council-text-muted)] hover:text-[var(--council-text)] font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-md bg-[var(--council-accent)] hover:opacity-90 disabled:opacity-40 text-[var(--bg-canvas)] font-semibold transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Begin debate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
