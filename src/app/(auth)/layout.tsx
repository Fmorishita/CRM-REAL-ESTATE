export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-sidebar px-4 py-12">
      {/* Soft gold glow, brand-only decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
      />
      <div className="relative text-center">
        <p className="font-heading text-4xl font-semibold text-sidebar-foreground">Legacy Capital</p>
        <p className="mt-1 text-xs tracking-[0.3em] text-gold uppercase">Realtor Pro · CRM</p>
      </div>
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  );
}
