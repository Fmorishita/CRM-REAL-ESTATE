import { CommandBar } from "@/components/shared/command-bar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import type { ModuleKey } from "@/config/modules";

interface TopbarProps {
  userName: string;
  userEmail: string;
  roleLabel: string;
  authEnabled: boolean;
  visibleModules: ModuleKey[];
}

export function Topbar({ userName, userEmail, roleLabel, authEnabled, visibleModules }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <div className="flex flex-1 items-center gap-3">
        <CommandBar visibleModules={visibleModules} />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={userName} email={userEmail} roleLabel={roleLabel} authEnabled={authEnabled} />
      </div>
    </header>
  );
}
