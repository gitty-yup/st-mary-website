import { officeRoute } from '@/lib/office/api';
import { sendPhotoInvitation } from '@/lib/office/email';
import { RecordError } from '@/lib/office/records';
import { addPerson, changeRole, markInvited, personById, removePerson, type SharingPerson } from '@/lib/gallery/sharing';

/** Emails the invitation; says so if it couldn't (they're on the list either way). */
async function invite(person: SharingPerson): Promise<{ person: SharingPerson; invited: boolean }> {
  try {
    await sendPhotoInvitation(person.email, person.name, person.role);
    await markInvited(person.id);
    return { person: { ...person, invitedAt: new Date().toISOString() }, invited: true };
  } catch (err) {
    console.error('[gallery people] invitation failed:', err instanceof Error ? err.message : err);
    return { person, invited: false };
  }
}

/**
 * The people who share or review photos (office only):
 *   POST { action: 'add', name, email, role }  → { person, invited }
 *   POST { action: 'invite', id }               → { person, invited }
 *   POST { action: 'role', id, role }           → { person }
 *   POST { action: 'remove', id }               → { removed: true }
 */
export default officeRoute(
  ['POST'],
  async (req, res, session) => {
    const body = req.body ?? {};
    switch (body.action) {
      case 'add':
        return res.status(200).json(await invite(await addPerson(body, session.email)));
      case 'invite':
        return res.status(200).json(await invite(await personById(body.id)));
      case 'role':
        return res.status(200).json({ person: await changeRole(body.id, body.role, session.email) });
      case 'remove':
        await removePerson(body.id, session.email);
        return res.status(200).json({ removed: true });
      default:
        throw new RecordError('Unknown action.', 400);
    }
  },
  'people',
);
