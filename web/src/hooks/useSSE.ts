import { useState, useRef, useCallback } from "react";
import { TranscriptEntry } from "../types";

export interface SSETotals {
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  isEstimated: boolean;
}

interface UseSSEOptions {
  sessionId: string | null;
  onTranscriptUpdate: (updater: (prev: TranscriptEntry[]) => TranscriptEntry[]) => void;
  onTotalsUpdate: (totals: Partial<SSETotals>) => void;
}

export function useSSE({ sessionId, onTranscriptUpdate, onTotalsUpdate }: UseSSEOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setActiveSpeaker(null);
    onTranscriptUpdate((prev) =>
      prev.map((e) => (e.is_streaming ? { ...e, is_streaming: false } : e))
    );
  }, [onTranscriptUpdate]);

  const startStream = useCallback(
    async (
      endpoint: "rounds" | "summary" | "moderator",
      body: Record<string, any> = {}
    ) => {
      if (!sessionId) return;
      if (isStreaming) {
        abortStream();
      }

      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`/api/sessions/${sessionId}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Failed to start stream: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            if (!block.trim()) continue;

            let eventName = "message";
            let rawData = "";

            for (const line of block.split("\n")) {
              if (line.startsWith("event: ")) {
                eventName = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                rawData = line.slice(6).trim();
              }
            }

            if (!rawData) continue;
            let data: any = {};
            try {
              data = JSON.parse(rawData);
            } catch {
              continue;
            }

            switch (eventName) {
              case "member_start":
              case "chair_start": {
                const speakerName = data.member;
                const isChair = eventName === "chair_start";
                setActiveSpeaker(speakerName);
                onTranscriptUpdate((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(),
                    round: data.round,
                    speaker: speakerName,
                    text: "",
                    is_chair: isChair,
                    is_streaming: true,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ]);
                break;
              }

              case "token": {
                const token = data.token;
                onTranscriptUpdate((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  if (!last.is_streaming) return prev;
                  return [
                    ...prev.slice(0, -1),
                    { ...last, text: last.text + token },
                  ];
                });
                break;
              }

              case "turn_end": {
                onTranscriptUpdate((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  return [
                    ...prev.slice(0, -1),
                    {
                      ...last,
                      text: data.text || last.text,
                      is_streaming: false,
                      input_tokens: data.input_tokens,
                      output_tokens: data.output_tokens,
                    },
                  ];
                });
                break;
              }

              case "summary_done": {
                onTranscriptUpdate((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  return [
                    ...prev.slice(0, -1),
                    {
                      ...last,
                      text: data.text || last.text,
                      is_streaming: false,
                      input_tokens: data.input_tokens,
                      output_tokens: data.output_tokens,
                    },
                  ];
                });
                if (data.total_cost_usd !== undefined) {
                  onTotalsUpdate({ totalCostUsd: data.total_cost_usd });
                }
                break;
              }

              case "member_error":
              case "chair_error": {
                const speakerName = data.member;
                onTranscriptUpdate((prev) => {
                  if (prev.length > 0 && prev[prev.length - 1].is_streaming) {
                    const last = prev[prev.length - 1];
                    return [
                      ...prev.slice(0, -1),
                      {
                        ...last,
                        text: `Error: ${data.error}`,
                        is_streaming: false,
                        is_error: true,
                      },
                    ];
                  }
                  return [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      speaker: speakerName,
                      text: `Error: ${data.error}`,
                      is_streaming: false,
                      is_error: true,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ];
                });
                break;
              }

              case "round_end": {
                onTotalsUpdate({
                  totalCostUsd: data.total_cost_usd,
                  inputTokens: data.total_input_tokens,
                  outputTokens: data.total_output_tokens,
                  isEstimated: data.is_estimated,
                });
                break;
              }

              case "moderator_pick": {
                setActiveSpeaker(data.picked);
                break;
              }

              case "moderator_done": {
                onTranscriptUpdate((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(),
                    speaker: "Moderator",
                    text: `✓ ${data.message || "Debate complete"}`,
                    is_chair: true,
                    is_streaming: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ]);
                break;
              }

              case "session_done": {
                if (data.total_cost_usd !== undefined) {
                  onTotalsUpdate({ totalCostUsd: data.total_cost_usd });
                }
                break;
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Stream error:", err);
        }
      } finally {
        setIsStreaming(false);
        setActiveSpeaker(null);
        abortControllerRef.current = null;
      }
    },
    [sessionId, isStreaming, abortStream, onTranscriptUpdate, onTotalsUpdate]
  );

  return {
    isStreaming,
    activeSpeaker,
    startStream,
    abortStream,
  };
}
