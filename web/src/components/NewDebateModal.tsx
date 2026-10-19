import React, { useState } from "react";
import { X, Play, Sparkles } from "lucide-react";

interface NewDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDebate: (topic: string, words: number, rounds: number) => void;
}

const SAMPLE_TOPICS = [
  "Should engineering teams prefer a modular monolith over microservices by default?",
  "Will LLM agent swarms make traditional software architectures obsolete within 3 years?",
  "Is Rust's borrow checker worth the productivity cost for startup MVPs?",
  "Should artificial intelligence systems be granted legal personhood or rights?",
];

export const NewDebateModal: React.FC<NewDebateModalProps> = ({
  isOpen,
  onClose,
  onStartDebate,
}) => {
  const [topic, setTopic] = useState("");
  const [words, setWords] = useState(120);
  const [rounds, setRounds] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStartDebate(topic.trim(), words, rounds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏛️</span>
            <h3 className="font-semibold text-sm text-white">Start New Council Debate</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              Topic or Question
            </label>
            <textarea
              required
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should the council debate?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
            />
          </div>

          {/* Sample Topic Chips */}
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1.5">
              Or pick an idea to explore:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TOPICS.map((t, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setTopic(t)}
                  className="text-left text-[11px] px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition line-clamp-1"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Words per turn: <span className="text-indigo-400 font-mono">{words}</span>
              </label>
              <input
                type="range"
                min={50}
                max={300}
                step={10}
                value={words}
                onChange={(e) => setWords(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Initial Rounds
              </label>
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
              >
                <option value={1}>1 round</option>
                <option value={2}>2 rounds</option>
                <option value={3}>3 rounds</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Begin Debate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
