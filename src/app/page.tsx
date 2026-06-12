const phase0Deliverables = [
  { label: "Product blueprint", doc: "docs/00-product-blueprint.md" },
  { label: "Arquitectura general", doc: "docs/01-architecture.md" },
  { label: "Modelo de datos inicial", doc: "docs/02-data-model.md" },
  { label: "Roadmap MVP / V2 / V3", doc: "docs/03-roadmap.md" },
  { label: "Decisiones técnicas (ADRs)", doc: "docs/04-technical-decisions.md" },
  { label: "Riesgos y supuestos", doc: "docs/05-risks-and-assumptions.md" },
];

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl py-24">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Fase 0 — Product Blueprint
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Realtor Pro CRM
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          El sistema operativo inmobiliario: CRM, inbox omnicanal, propiedades,
          automatizaciones e inteligencia artificial para agentes, brokers,
          inmobiliarias y desarrolladoras.
        </p>
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Entregables de esta fase
          </h2>
          <ul className="mt-4 space-y-3">
            {phase0Deliverables.map((item) => (
              <li
                key={item.doc}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="text-zinc-700 dark:text-zinc-300">
                  {item.label}
                </span>
                <code className="shrink-0 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                  {item.doc}
                </code>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-500">
          Siguiente fase: Foundation SaaS — AppShell, navegación, theme y tenant
          context.
        </p>
      </main>
    </div>
  );
}
