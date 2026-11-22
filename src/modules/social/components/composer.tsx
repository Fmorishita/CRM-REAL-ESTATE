"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { ChannelIcon } from "@/modules/dashboard/components/channel-badge";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { publishPost } from "@/modules/social/server/actions";

export function SocialComposer({ connected, hasInstagram }: { connected: boolean; hasInstagram: boolean }) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [facebook, setFacebook] = React.useState(true);
  const [instagram, setInstagram] = React.useState(false);
  const [schedule, setSchedule] = React.useState(false);
  const [when, setWhen] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connected) {
      toast.info("Conecta la página de Facebook para publicar.");
      return;
    }
    setPending(true);
    const result = await publishPost({
      text,
      imageUrl,
      facebook,
      instagram,
      scheduledAt: schedule && when ? new Date(when).toISOString() : undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success(`Publicado en ${result.data.results.join(", ")}.`);
      setText("");
      setImageUrl("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const igBlocked = instagram && (!imageUrl || schedule);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="post-text">Texto</Label>
        <Textarea
          id="post-text"
          rows={6}
          maxLength={2200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Casas frente al mar en El Sauzal, Ensenada. Agenda tu visita…"
        />
        <p className="text-right text-[11px] text-muted-foreground tabular-nums">{text.length}/2200</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="post-image">Imagen (enlace https)</Label>
        <Input id="post-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/foto.jpg" />
        {imageUrl.startsWith("https://") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Vista previa" className="mt-2 max-h-48 rounded-lg border border-border object-cover" />
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className={cn("flex items-center gap-3 rounded-lg border p-3", facebook ? "border-primary" : "border-border")}>
          <ChannelIcon channel="facebook" />
          <span className="flex-1 text-sm">Facebook</span>
          <Switch checked={facebook} onCheckedChange={setFacebook} />
        </label>
        <label className={cn("flex items-center gap-3 rounded-lg border p-3", instagram ? "border-primary" : "border-border", !hasInstagram && "opacity-50")}>
          <ChannelIcon channel="instagram" />
          <span className="flex-1 text-sm">Instagram</span>
          <Switch checked={instagram} onCheckedChange={setInstagram} disabled={!hasInstagram} />
        </label>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          Programar (solo Facebook)
          <Switch checked={schedule} onCheckedChange={setSchedule} />
        </label>
        {schedule ? <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Fecha y hora" /> : null}
      </div>

      {igBlocked ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {schedule ? "Instagram no permite programar desde la API." : "Instagram requiere una imagen."}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending || !text.trim() || (!facebook && !instagram) || igBlocked || (schedule && !when)}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        {schedule ? "Programar" : "Publicar ahora"}
      </Button>
    </form>
  );
}
