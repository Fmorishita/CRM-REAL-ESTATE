"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  CheckSquare,
  Loader2,
  Plus,
  StickyNote,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createQuickNote, createQuickTask } from "@/modules/quick/server/actions";

type Mode = "menu" | "task" | "note";

/** Mobile field-agent quick actions: floating button → bottom sheet. */
export function QuickActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("menu");
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function reset() {
    setMode("menu");
    setValue("");
  }

  async function submit() {
    if (!value.trim()) return;
    setPending(true);
    const result = mode === "task" ? await createQuickTask({ title: value }) : await createQuickNote({ body: value });
    setPending(false);
    if (result.ok) {
      toast.success(mode === "task" ? "Tarea creada." : "Nota guardada.");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  // The inbox has its own composer pinned bottom-right; the FAB would cover the
  // send button there, so hide it on that route.
  if (pathname?.startsWith("/inbox")) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <SheetTrigger asChild>
        <button
          aria-label="Acciones rápidas"
          className="fixed right-4 bottom-20 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
        >
          <Plus className="size-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-[max(env(safe-area-inset-bottom),1rem)]">
        <SheetHeader>
          <SheetTitle>{mode === "task" ? "Tarea rápida" : mode === "note" ? "Nota rápida" : "Acciones rápidas"}</SheetTitle>
        </SheetHeader>

        {mode === "menu" ? (
          <div className="grid grid-cols-2 gap-2 px-4 pb-2">
            <QuickButton icon={CheckSquare} label="Tarea rápida" onClick={() => setMode("task")} />
            <QuickButton icon={StickyNote} label="Nota rápida" onClick={() => setMode("note")} />
            <QuickLink icon={UserPlus} label="Nuevo contacto" href="/contacts" onNavigate={() => setOpen(false)} />
            <QuickLink icon={CalendarClock} label="Agendar visita" href="/visits" onNavigate={() => setOpen(false)} />
            <QuickLink icon={Building2} label="Propiedades" href="/properties" onNavigate={() => setOpen(false)} />
          </div>
        ) : (
          <div className="space-y-3 px-4 pb-2">
            {mode === "task" ? (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ej. Llamar a Roberto a las 5pm"
                autoFocus
              />
            ) : (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Escribe una nota rápida…"
                rows={3}
                autoFocus
              />
            )}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={reset}>
                <X />
                Atrás
              </Button>
              <Button size="sm" onClick={submit} disabled={pending || !value.trim()}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function QuickButton({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="size-5 text-muted-foreground" />
      {label}
    </button>
  );
}

function QuickLink({
  icon: Icon,
  label,
  href,
  onNavigate,
}: {
  icon: typeof Plus;
  label: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-xs font-medium text-foreground transition-colors hover:bg-muted",
      )}
    >
      <Icon className="size-5 text-muted-foreground" />
      {label}
    </Link>
  );
}
