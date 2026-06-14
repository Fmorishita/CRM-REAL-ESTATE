"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { actionLabel, AUTOMATION_TEMPLATES, triggerLabel } from "@/config/automations";
import { createFromTemplate } from "@/modules/automations/server/actions";

export function TemplateGallery() {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function onUse(key: string) {
    setPending(key);
    const result = await createFromTemplate({ templateKey: key });
    setPending(null);
    if (result.ok) {
      toast.success("Automatización creada desde plantilla.");
      router.push(`/automations/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {AUTOMATION_TEMPLATES.map((t) => (
        <Card key={t.key} className="gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-violet-500" />
              {t.name}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Trigger:</span> {triggerLabel(t.trigger.type)}
            </p>
            <div className="flex flex-wrap gap-1">
              {t.actions.map((a, i) => (
                <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {actionLabel(a.type)}
                </span>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full" disabled={pending === t.key} onClick={() => onUse(t.key)}>
              {pending === t.key ? <Loader2 className="animate-spin" /> : <Plus />}
              Usar plantilla
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
