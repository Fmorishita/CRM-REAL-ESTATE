"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addContactNote } from "@/modules/contacts/server/actions";
import type { ContactNoteView } from "@/modules/contacts/types";

export function ContactNotes({
  contactId,
  notes,
  canEdit,
}: {
  contactId: string;
  notes: ContactNoteView[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const result = await addContactNote({ contactId, body });
    setPending(false);
    if (result.ok) {
      setBody("");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <form onSubmit={onSubmit} className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Agrega una nota interna sobre este contacto…"
            rows={3}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !body.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Agregar nota
            </Button>
          </div>
        </form>
      ) : null}

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay notas.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-foreground">{note.body}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {note.authorName ?? "Sistema"} · {note.atLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
