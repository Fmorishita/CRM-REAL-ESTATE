export interface AuditLogView {
  id: string;
  action: string;
  actionLabel: string;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  atLabel: string;
}
