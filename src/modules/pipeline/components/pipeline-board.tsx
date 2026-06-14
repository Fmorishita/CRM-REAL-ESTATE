"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, MapPin, User } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { moveOpportunity } from "@/modules/pipeline/server/actions";
import type { OpportunityCard, PipelineColumn } from "@/modules/pipeline/types";

function riskTone(risk: OpportunityCard["aiRisk"]): string {
  if (risk === "high") return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (risk === "medium") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (risk === "low") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  return "";
}

export function PipelineBoard({
  columns: initialColumns,
  persist,
}: {
  columns: PipelineColumn[];
  persist: boolean;
}) {
  const router = useRouter();
  const [columns, setColumns] = React.useState(initialColumns);
  const [syncedColumns, setSyncedColumns] = React.useState(initialColumns);
  const [activeCard, setActiveCard] = React.useState<OpportunityCard | null>(null);

  // Re-sync local board state when the server sends fresh data (after refresh).
  if (syncedColumns !== initialColumns) {
    setSyncedColumns(initialColumns);
    setColumns(initialColumns);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const cardIndex = React.useMemo(() => {
    const map = new Map<string, { card: OpportunityCard; columnId: string }>();
    for (const col of columns) for (const card of col.cards) map.set(card.id, { card, columnId: col.id });
    return map;
  }, [columns]);

  function onDragStart(event: DragStartEvent) {
    const entry = cardIndex.get(String(event.active.id));
    setActiveCard(entry?.card ?? null);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const source = cardIndex.get(cardId);
    if (!source) return;

    // `over` may be a column or another card — resolve to a column id.
    const overId = String(over.id);
    const targetColumnId = columns.some((c) => c.id === overId)
      ? overId
      : cardIndex.get(overId)?.columnId;
    if (!targetColumnId || targetColumnId === source.columnId) return;

    const previous = columns;
    const moved = source.card;
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === source.columnId) return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        if (col.id === targetColumnId) return { ...col, cards: [{ ...moved, stageId: targetColumnId }, ...col.cards] };
        return col;
      }),
    );

    if (!persist) {
      toast.info("Modo demo: el cambio no se guarda.");
      return;
    }

    const result = await moveOpportunity({ opportunityId: cardId, stageId: targetColumnId });
    if (result.ok) {
      const target = columns.find((c) => c.id === targetColumnId);
      toast.success(`Oportunidad movida a "${target?.name ?? "etapa"}".`);
      router.refresh();
    } else {
      setColumns(previous);
      toast.error(result.error);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {columns.map((column) => (
          <BoardColumn key={column.id} column={column} />
        ))}
      </div>
      <DragOverlay>{activeCard ? <CardBody card={activeCard} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function BoardColumn({ column }: { column: PipelineColumn }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
        isOver ? "border-primary/50 bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{column.name}</span>
          <span className="text-xs text-muted-foreground">{column.cards.length}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{column.totalValueLabel}</span>
      </div>
      <div className="flex min-h-24 flex-col gap-2 px-2 pb-2">
        {column.cards.map((card) => (
          <DraggableCard key={card.id} card={card} />
        ))}
        {column.cards.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">Arrastra aquí</p>
        ) : null}
      </div>
    </div>
  );
}

function DraggableCard({ card }: { card: OpportunityCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isDragging && "opacity-40")}
    >
      <CardBody card={card} />
    </div>
  );
}

function CardBody({ card, dragging }: { card: OpportunityCard; dragging?: boolean }) {
  return (
    <div
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm active:cursor-grabbing",
        dragging && "rotate-2 shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{card.contactName}</p>
        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      </div>
      {card.propertyTitle ? (
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {card.propertyTitle}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{card.amountLabel}</span>
        {card.aiRisk ? (
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", riskTone(card.aiRisk))}>
            {card.probability}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{card.probability}%</span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="size-3" />
          {card.assignedName ?? "Sin asignar"}
        </span>
        {card.closeDateLabel ? <span>{card.closeDateLabel}</span> : null}
      </div>
    </div>
  );
}
