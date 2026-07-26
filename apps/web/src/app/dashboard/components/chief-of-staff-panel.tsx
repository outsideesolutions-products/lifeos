"use client";

import { useState } from "react";
import { chiefOfStaffApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

/**
 * "The first element on the page is always the AI Chief of Staff... the
 * experience begins with conversation" (UI/UX Specification §5). This is a
 * live conversation with the Milestone 1 baseline orchestrator
 * (ai/orchestrator's single-agent conversational loop), not a scripted
 * greeting — whatever appears here is whatever the AI actually generates
 * from the real Constitution + Working Memory context it gathers.
 *
 * The UI thread itself is ephemeral (resets on reload) — the orchestrator
 * already gives the AI real continuity across turns via its own Working
 * Memory read/write (see ai/orchestrator's README), so re-rendering the
 * full transcript client-side isn't required for that continuity to work,
 * only for the user to see their own prior turns after a refresh. That's
 * deferred, not silently dropped: revisit once there's a UI need for it.
 */
export function ChiefOfStaffPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send(message: string) {
    if (!message.trim() || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    try {
      const { response } = await chiefOfStaffApi.sendMessage(message);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content:
            "Your Chief of Staff couldn't respond just now. This is usually because no AI provider is configured yet — try again once one is.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex min-h-32 flex-1 flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-zinc-500">
              What would you like to do today?
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : m.role === "error"
                    ? "self-start rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "self-start rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900"
              }
            >
              {m.content}
            </div>
          ))}
          {sending && <p className="text-sm text-zinc-400">Thinking...</p>}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your Chief of Staff anything..."
            disabled={sending}
          />
          <Button type="submit" disabled={sending}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
