import { recordAudit } from '@/lib/office/audit';
import { sendRequiemNotice, sendRequiemReceipt } from '@/lib/office/email';
import { GIVE_ONLINE_URL, remembranceLabel, serviceDateLabel, type RequiemInput } from '@/lib/requiem/rules';
import { createRequiemRequest, type RequiemRequest } from '@/lib/requiem/store';

/**
 * Saves a request, then emails Hayr Eremia and the office and (if there's an email address)
 * sends the family a receipt. Email failures never lose a request: it's already in the list.
 */
export async function submitRequiem(
  data: RequiemInput,
  how: { source: 'online' | 'paper'; sameDay: boolean; ipHash: string | null; by: string },
): Promise<{ request: RequiemRequest; receipt: boolean }> {
  const request = await createRequiemRequest(data, how.ipHash, { source: how.source, sameDay: how.sameDay });
  const when = serviceDateLabel(data.serviceDate);
  const summary = { ...data, source: how.source, sameDay: how.sameDay };
  const [notice, receipt] = await Promise.allSettled([
    sendRequiemNotice(summary, when, remembranceLabel),
    data.email ? sendRequiemReceipt(summary, when, GIVE_ONLINE_URL) : Promise.resolve(null),
  ]);
  if (notice.status === 'rejected') console.error('[requiem] notice email failed:', notice.reason instanceof Error ? notice.reason.message : notice.reason);
  if (receipt.status === 'rejected') console.error('[requiem] receipt email failed:', receipt.reason instanceof Error ? receipt.reason.message : receipt.reason);
  const receiptSent = !!data.email && receipt.status === 'fulfilled';
  await recordAudit(null, how.by, 'requiem', {
    what: how.source === 'paper' ? 'paper request' : 'request',
    id: request.id,
    serviceDate: data.serviceDate,
    sameDay: how.sameDay,
    names: data.names.length,
    hokijash: data.hokijash,
    fellowship: data.fellowship,
    offering: data.offering,
    notice: notice.status === 'fulfilled' ? { sent: true, to: notice.value } : { sent: false },
    receipt: { sent: receiptSent },
  });
  return { request, receipt: receiptSent };
}
