import { SACRAMENT_DATE_FIELD } from '@/certificates';
import { officeRoute } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { sendNeedsInfoEmail } from '@/lib/office/email';
import { changeStatus, getAudit, getRecord } from '@/lib/office/records';
import { DECLINE_REASONS, STATUS_ACTIONS, type StatusAction } from '@/lib/office/status';

const MAX_NOTE = 2000;

/**
 * Review actions: approve (ready to issue), needs_info (optionally emailing
 * the family), decline, reopen, void. Body: { action, version, note?, reason?, emailFamily? }.
 */
export default officeRoute(['POST'], async (req, res, session) => {
  const id = String(req.query.id);
  const action = req.body?.action as StatusAction;
  if (!Object.prototype.hasOwnProperty.call(STATUS_ACTIONS, action)) return res.status(400).json({ error: 'Unknown action.' });

  const note = typeof req.body?.note === 'string' ? req.body.note.replace(/\r\n/g, '\n').trim() : '';
  if (note.length > MAX_NOTE) return res.status(400).json({ error: `Please keep the note under ${MAX_NOTE} characters.` });
  const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';

  if (action === 'needs_info' && !note) return res.status(400).json({ error: 'Describe what information is needed.' });
  if (action === 'void' && !note) return res.status(400).json({ error: 'Give the reason for voiding.' });
  if (action === 'decline') {
    if (!Object.prototype.hasOwnProperty.call(DECLINE_REASONS, reason)) return res.status(400).json({ error: 'Choose a reason.' });
    if (reason === 'other' && !note) return res.status(400).json({ error: 'Describe the reason.' });
  }

  const before = await getRecord(id);
  if (!before) return res.status(404).json({ error: 'Record not found.' });
  const emailFamily = action === 'needs_info' && req.body?.emailFamily === true;
  if (emailFamily && !before.contactEmail) return res.status(400).json({ error: 'This record has no family email address.' });

  const record = await changeStatus(id, Number(req.body?.version), action, { note, reason: action === 'decline' ? reason : undefined }, session.email);

  let emailed: boolean | undefined;
  if (emailFamily) {
    try {
      const sent = await sendNeedsInfoEmail({
        type: record.type,
        sacramentDate: record.officeData[SACRAMENT_DATE_FIELD[record.type]] ?? '',
        contactName: record.contactName,
        contactEmail: record.contactEmail!,
        message: note,
      });
      await recordAudit(id, session.email, 'email', { purpose: 'needs_info', sent: true, test: sent.test });
      emailed = true;
    } catch (err) {
      console.error('[office status] needs-info email failed:', err instanceof Error ? err.message : err);
      await recordAudit(id, session.email, 'email', { purpose: 'needs_info', sent: false });
      emailed = false;
    }
  }
  return res.status(200).json({ record, audit: await getAudit(id), emailed });
});
