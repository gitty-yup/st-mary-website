import { officeRoute } from '@/lib/office/api';
import { recentBackups, runBackup } from '@/lib/office/backup';

/** POST: run the Google Sheets backup now ("Back up now" on /office/backup). */
export default officeRoute(['POST'], async (_req, res, session) => {
  const result = await runBackup(session.email);
  return res.status(result.ok ? 200 : 502).json({ ...result, runs: await recentBackups() });
});
