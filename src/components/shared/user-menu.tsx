"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, LogOut, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type Role } from "@/config/permissions";
import { VIEW_AS_ROLES } from "@/lib/auth/view-as-roles";
import { getInitials } from "@/lib/format";
import { signOutAction } from "@/modules/auth/server/actions";
import { enterViewAs } from "@/modules/auth/server/view-as";

interface UserMenuProps {
  name: string;
  email: string;
  roleLabel: string;
  /** When false (demo mode), sign-out is disabled — there is no real session. */
  authEnabled: boolean;
  /** Whether the real user may use the "ver como" preview. */
  canViewAs: boolean;
  /** The role currently being previewed, if any. */
  viewAsRole: Role | null;
}

export function UserMenu({ name, email, roleLabel, authEnabled, canViewAs, viewAsRole }: UserMenuProps) {
  const router = useRouter();
  const signOutFormRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  function preview(role: Role) {
    start(async () => {
      const result = await enterViewAs(role);
      if (result.ok) {
        toast.success(`Viendo como ${ROLE_LABELS[role]} (solo lectura).`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de usuario">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{name}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
            <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <UserRound />
            Mi perfil
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Configuración
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {canViewAs ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={pending}>
                <Eye />
                Ver como…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {VIEW_AS_ROLES.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onSelect={(event) => {
                      event.preventDefault();
                      preview(role);
                    }}
                  >
                    {ROLE_LABELS[role]}
                    {viewAsRole === role ? <Check className="ml-auto size-3.5" /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}

        <DropdownMenuSeparator />
        {authEnabled ? (
          <>
            <form ref={signOutFormRef} action={signOutAction} className="hidden" />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                signOutFormRef.current?.requestSubmit();
              }}
            >
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>
            <LogOut />
            Cerrar sesión
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
