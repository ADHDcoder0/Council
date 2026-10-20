import React, { useState } from "react";
import { Icon } from "./Icon";

interface NewDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDebate: (topic: string, words: number, rounds: number) => void;
}

const SAMPLE_TOPICS = [
  {
    title: "Should engineering teams prefer a modular monolith over microservices by default?",
    description: "Deliberate boundary isolation, deployment complexity, and team scaling trade-offs.",
  },
  {
    title: "Will agent swarms make traditional deterministic workflow engines obsolete within 3 years?",
    description: "Contrast autonomous agency against reliability, auditing, and state machine guarantees.",
  },
  {
    title: "Is Rust’s borrow checker worth the productivity cost for early-stage startup MVPs?",
    description: "Compare developer velocity, runtime correctness, and memory safety implications.",
  },
  {
    title: "Should synthetic data generation replace real production snapshots for local dev and testing?",
    description: "Evaluate data privacy compliance, edge-case coverage, and pipeline maintenance overhead.",
  },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-surface-1 border border-subtle rounded-[16px] flex flex-col shadow-none overflow-hidden transition-colors duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-subtle flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">•</span>
            <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary">
              Start a New Debate
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-150"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] leading-[18px] font-medium text-text-primary mb-1.5">
              Topic or Question
            </label>
            <textarea
              required
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What question should the council deliberate?"
              className="w-full bg-surface-2 border border-subtle rounded-[12px] p-3 text-[14px] leading-[20px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-strong transition-colors duration-150"
            />
          </div>

          {/* Sample Topic List Rows with trailing chevron shifting 2px on hover */}
          <div>
            <span className="text-[12px] font-mono uppercase tracking-[0.06em] text-text-tertiary block mb-2">
              Suggested Topics
            </span>
            <div className="space-y-2">
              {SAMPLE_TOPICS.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setTopic(item.title)}
                  className="w-full text-left group p-3.5 rounded-[12px] bg-surface-2 border border-subtle hover:border-strong transition-colors duration-150 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] leading-[20px] font-semibold text-text-primary group-hover:text-text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[12px] leading-[16px] text-text-secondary mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <span className="text-text-tertiary group-hover:translate-x-0.5 transition-transform duration-150 shrink-0">
                    <Icon name="chevron-right" size={16} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Words per turn
              </label>
              <select
                value={words}
                onChange={(e) => setWords(e.target.value)}
                className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-[13px] text-text-primary focus:outline-none focus:border-strong"
              >
                <option value="80">80 words · concise</option>
                <option value="120">120 words · balanced</option>
                <option value="200">200 words · detailed</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Initial rounds
              </label>
              <select
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                className="w-full bg-surface-2 border border-subtle rounded-btn p-2.5 text-[13px] text-text-primary focus:outline-none focus:border-strong"
              >
                <option value="1">1 round</option>
                <option value="2">2 rounds</option>
                <option value="3">3 rounds</option>
                <option value="5">5 rounds</option>
              </select>
            </div>
          </div>

          {/* Footer: 40px buttons */}
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
              disabled={!topic.trim()}
              className="h-10 px-5 rounded-pill bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover disabled:opacity-40 text-[13px] font-medium transition-colors duration-150 flex items-center gap-1.5"
            >
              <Icon name="play" size={14} />
              <span>Begin debate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
