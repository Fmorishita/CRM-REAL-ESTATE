"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/config/permissions";
import { INVITABLE_ROLES } from "@/modules/organizations/roles";
import { inviteTeammate } from "@/modules/organizations/server/actions";

export function InviteTeammate({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<string>("agent");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    const result = await inviteTeammate({ email, role, name: name || undefined });
    setPending(false);
    if (result.ok) {
      toast.success(
        demo
          ? `Invitación simulada para ${result.data.email} (demo).`
          : `Invitación enviada a ${result.data.email}.`,
      );
      setOpen(false);
      setEmail("");
      setName("");
      setRole("agent");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus />
          Invitar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar a un miembro</DialogTitle>
          <DialogDescription>
            {demo
              ? "En modo demo la invitación se simula y no se guarda."
              : "Tendrá acceso a tu organización al iniciar sesión con este email."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@inmobiliaria.mx"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Nombre (opcional)</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending || !email.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Enviar invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
