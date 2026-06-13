"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckSquare,
  Loader2,
  Send,
  Sparkles,
  StickyNote,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONVERSATION_STATUS_LABELS, channelLabel } from "@/config/channels";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "@/modules/dashboard/components/channel-badge";
import {
  addConversationNote,
  assignConversation,
  createTaskFromConversation,
  recommendProperty,
  sendMessage,
  setConversationStatus,
  suggestReplyWithAi,
} from "@/modules/inbox/server/actions";
import type { ChatMessage, ConversationDetail, InboxOptions } from "@/modules/inbox/types";

export function ConversationView({
  conversation,
  options,
  persist,
  canReply,
}: {
  conversation: ConversationDetail;
  options: InboxOptions;
  persist: boolean;
  canReply: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ChatMessage[]>(conversation.messages);
  const [syncKey, setSyncKey] = React.useState(conversation.id + conversation.messages.length);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [suggesting, setSuggesting] = React.useState(false);

  async function onSuggest() {
    setSuggesting(true);
    const result = await suggestReplyWithAi({ conversationId: conversation.id });
    setSuggesting(false);
    if (result.ok) {
      setBody(result.data.text);
      toast.success(result.data.mocked ? "Sugerencia generada (mock)." : "Sugerencia generada con IA.");
    } else {
      toast.error(result.error);
    }
  }

  const currentKey = conversation.id + conversation.messages.length;
  if (syncKey !== currentKey) {
    setSyncKey(currentKey);
    setMessages(conversation.messages);
  }

  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function onSend() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        direction: "outbound",
        authorType: "member",
        authorName: "Tú",
        body: text,
        timeLabel: "ahora",
        status: "sent",
      },
    ]);
    setBody("");

    if (persist) {
      const result = await sendMessage({ conversationId: conversation.id, body: text });
      if (result.ok) router.refresh();
      else toast.error(result.error);
    } else {
      toast.info("Modo demo: el mensaje no se guarda.");
    }
    setSending(false);
  }

  async function runAction(promise: Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    const result = await promise;
    if (result.ok) {
      toast.success(successMsg);
      router.refresh();
    } else {
      toast.error(result.error ?? "Ocurrió un error.");
    }
  }

  async function onAddNote() {
    const text = note.trim();
    if (!text) return;
    const result = await addConversationNote({ conversationId: conversation.id, body: text });
    if (result.ok) {
      setNote("");
      toast.success("Nota interna agregada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">{getInitials(conversation.contactName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">{conversation.contactName}</span>
              <ChannelIcon channel={conversation.channel} />
            </div>
            <span className="text-xs text-muted-foreground">{channelLabel(conversation.channel)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            defaultValue={conversation.status}
            onValueChange={(v) =>
              runAction(setConversationStatus({ conversationId: conversation.id, status: v }), "Estado actualizado.")
            }
          >
            <SelectTrigger size="sm" className="w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONVERSATION_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Zap />
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => runAction(assignConversation({ conversationId: conversation.id, membershipId: null }), "Conversación sin asignar.")}
              >
                <User />
                Sin asignar
              </DropdownMenuItem>
              {options.members.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => runAction(assignConversation({ conversationId: conversation.id, membershipId: m.id }), `Asignada a ${m.name}.`)}
                >
                  <User />
                  {m.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTaskOpen((v) => !v)}>
                <CheckSquare />
                Crear tarea
              </DropdownMenuItem>
              {conversation.contactId ? (
                <DropdownMenuItem asChild>
                  <Link href={`/contacts/${conversation.contactId}`}>
                    <User />
                    Ver contacto
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Recomendar propiedad</DropdownMenuLabel>
              {options.properties.slice(0, 5).map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() =>
                    runAction(recommendProperty({ conversationId: conversation.id, propertyId: p.id }), "Propiedad enviada.")
                  }
                >
                  <Building2 />
                  <span className="truncate">{p.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AI summary */}
      {conversation.aiSummary ? (
        <div className="flex items-start gap-2 border-b border-border bg-violet-500/5 px-4 py-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-500" />
          <div className="min-w-0 text-xs">
            <p className="text-foreground">{conversation.aiSummary}</p>
            {conversation.aiIntent ? (
              <Badge variant="secondary" className="mt-1">
                {conversation.aiIntent.replace(/_/g, " ")}
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {taskOpen ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-medium text-foreground">Nueva tarea</p>
            <div className="flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ej. Llamar para dar seguimiento"
              />
              <Button
                size="sm"
                disabled={!taskTitle.trim()}
                onClick={async () => {
                  await runAction(createTaskFromConversation({ conversationId: conversation.id, title: taskTitle }), "Tarea creada.");
                  setTaskTitle("");
                  setTaskOpen(false);
                }}
              >
                Crear
              </Button>
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {/* Internal notes */}
      {conversation.internalNotes.length > 0 ? (
        <div className="border-t border-border px-4 py-2">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <StickyNote className="size-3" />
            Notas internas
          </p>
          <ul className="space-y-1">
            {conversation.internalNotes.slice(0, 3).map((n) => (
              <li key={n.id} className="text-xs text-muted-foreground">
                <span className="text-foreground">{n.authorName ?? "—"}:</span> {n.body}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Composer */}
      {canReply ? (
        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <Button variant="outline" size="xs" onClick={onSuggest} disabled={suggesting}>
              {suggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
              Sugerir con IA
            </Button>
            {options.quickReplies.map((qr) => (
              <button
                key={qr.id}
                onClick={() => setBody(qr.body)}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {qr.title}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder="Escribe un mensaje… (⌘+Enter para enviar)"
              rows={2}
              className="min-h-10 flex-1 resize-none"
            />
            <Button onClick={onSend} disabled={sending || !body.trim()} size="icon">
              {sending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota interna (no se envía al cliente)…"
              className="h-8 flex-1 text-xs"
            />
            <Button variant="ghost" size="sm" disabled={!note.trim()} onClick={onAddNote}>
              <StickyNote />
              Nota
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const outbound = message.direction === "outbound";
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
          outbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        <p className={cn("mt-1 text-[10px]", outbound ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {message.authorName ? `${message.authorName} · ` : ""}
          {message.timeLabel}
        </p>
      </div>
    </div>
  );
}
