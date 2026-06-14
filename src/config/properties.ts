export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "Casa",
  apartment: "Departamento",
  land: "Terreno",
  office: "Oficina",
  retail: "Local comercial",
  warehouse: "Bodega",
  development: "Desarrollo",
  presale: "Preventa",
  vacation_rental: "Renta vacacional",
  rental: "Renta",
};

export const OPERATION_LABELS: Record<string, string> = {
  sale: "Venta",
  rent: "Renta",
  presale: "Preventa",
};

export const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Apartada",
  sold: "Vendida",
  rented: "Rentada",
  paused: "Pausada",
};

export const STATUS_TONES: Record<string, string> = {
  available: "text-emerald-600 dark:text-emerald-400",
  reserved: "text-amber-600 dark:text-amber-400",
  sold: "text-blue-600 dark:text-blue-400",
  rented: "text-blue-600 dark:text-blue-400",
  paused: "text-muted-foreground",
};

export function propertyTypeLabel(type: string): string {
  return PROPERTY_TYPE_LABELS[type] ?? type;
}

export function operationLabel(op: string): string {
  return OPERATION_LABELS[op] ?? op;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTone(status: string): string {
  return STATUS_TONES[status] ?? "text-muted-foreground";
}
