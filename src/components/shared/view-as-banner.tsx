"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, X } from "lucide-react";

import { ROLE_LABELS, type Role } from "@/config/permissions";
import { exitViewAs } from "@/modules/auth/server/view-as";

export function ViewAsBanner({ role, realRole }: { role: Role; realRole: Role }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function exit() {
    start(async () => {
      await exitViewAs();
      router.refresh();
    });
  }

  return (
    <div className="relative z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-amber-950">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="size-3.5" />
        Vista previa: viendo como <strong>{ROLE_LABELS[role]}</strong> (solo lectura) · tu rol real es{" "}
        {ROLE_LABELS[realRole]}
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md bg-amber-950/15 px-2 py-0.5 transition-colors hover:bg-amber-950/25 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
        Salir de la vista previa
      </button>
    </div>
  );
}
