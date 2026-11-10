import type { Queryable } from '@/lib/db';
import { query } from '@/lib/db';

export type AuditAction =
  | 'sign_in'
  | 'sign_out'
  | 'create'
  | 'update'
  | 'issue'
  | 'download';

export async function recordAudit(
  requestId: string | null,
  actor: string,
  action: AuditAction,
  detail: Record<string, unknown> = {},
  client?: Queryable,
): Promise<void> {
  const sql = 'insert into audit_events (request_id, actor, action, detail) values ($1, $2, $3, $4)';
  const params = [requestId, actor, action, JSON.stringify(detail)];
  if (client) await client.query(sql, params);
  else await query(sql, params);
}
