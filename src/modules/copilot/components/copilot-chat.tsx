"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COPILOT_SUGGESTIONS } from "@/config/copilot";
import { copilotConfirm, copilotSend } from "@/modules/copilot/server/actions";
import type { CopilotBlock, CopilotMessage, PendingAction } from "@/modules/copilot/types";

let idSeq = 0;
const nextId = () => `m${++idSeq}`;

export function CopilotChat() {
  const [messages, setMessages] = React.useState<CopilotMessage[]>([
    {
      id: nextId(),
      role: "assistant",
      text: "¡Hola! Soy tu copiloto de Realtor Pro. Pregúntame sobre tus leads, tu día, tus propiedades o pídeme crear una tarea.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: content }]);
    setPending(true);
    const result = await copilotSend({ message: content });
    setPending(false);
    if (result.ok) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", text: result.data.text, blocks: result.data.blocks, pendingAction: result.data.pendingAction },
      ]);
    } else {
      toast.error(result.error);
    }
  }

  async function onConfirm(action: PendingAction, messageId: string) {
    setPending(true);
    const result = await copilotConfirm({ kind: action.kind, payload: action.payload });
    setPending(false);
    // Remove the pending action from the originating message.
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pendingAction: undefined } : m)));
    if (result.ok) {
      setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: result.data.text, blocks: result.data.blocks }]);
    } else {
      toast.error(result.error);
    }
  }

  function dismiss(messageId: string) {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pendingAction: undefined } : m)));
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[480px] flex-col rounded-xl border border-border bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] space-y-2", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
              {m.blocks?.map((block, i) => <BlockView key={i} block={block} />)}
              {m.pendingAction ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5">
                  <span className="flex-1 text-xs text-foreground">{m.pendingAction.label}</span>
                  <Button size="xs" onClick={() => onConfirm(m.pendingAction!, m.id)} disabled={pending}>
                    <Check />
                    Confirmar
                  </Button>
                  <Button size="icon-xs" variant="ghost" onClick={() => dismiss(m.id)} aria-label="Cancelar">
                    <X />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Pensando…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {COPILOT_SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={pending}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale a tu copiloto…"
            disabled={pending}
          />
          <Button type="submit" size="icon" disabled={pending || !input.trim()}>
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}

function BlockView({ block }: { block: CopilotBlock }) {
  if (block.type === "text") {
    return <p className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">{block.text}</p>;
  }
  if (block.type === "stats") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {block.items.map((s, i) => (
          <div key={i} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-base font-semibold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "leads") {
    return (
      <ul className="space-y-1.5">
        {block.items.map((l) => (
          <li key={l.contactId} className="rounded-lg border border-border bg-card p-2.5">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/contacts/${l.contactId}`} className="text-sm font-medium text-foreground hover:underline">
                {l.name}
              </Link>
              <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                <Sparkles className="size-3" />
                {l.score}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{l.detail}</p>
            <p className="mt-0.5 text-xs text-foreground">→ {l.action}</p>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "properties") {
    return (
      <ul className="space-y-1.5">
        {block.items.map((p) => (
          <li key={p.propertyId} className="rounded-lg border border-border bg-card p-2.5">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/properties/${p.propertyId}`} className="text-sm font-medium text-foreground hover:underline">
                {p.title}
              </Link>
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{p.score}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {p.priceLabel}
              {p.detail ? ` · ${p.detail}` : ""}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  // list
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="mb-1 text-xs font-medium text-foreground">{block.title}</p>
      <ul className="space-y-0.5">
        {block.items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
