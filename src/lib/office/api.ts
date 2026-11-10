import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { requireOfficeApi, type OfficeSession } from '@/lib/office/auth';
import { RecordError } from '@/lib/office/records';

type OfficeHandler = (req: NextApiRequest, res: NextApiResponse, session: OfficeSession) => Promise<unknown>;

/** Wraps an office API route: method check, sign-in check, and error handling (no PII in logs). */
export function officeRoute(methods: string[], handler: OfficeHandler): NextApiHandler {
  return async (req, res) => {
    if (!methods.includes(req.method ?? '')) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    try {
      const session = await requireOfficeApi(req, res);
      if (!session) return;
      await handler(req, res, session);
    } catch (err) {
      if (err instanceof RecordError) return res.status(err.status).json({ error: err.message });
      console.error(`[office api] ${req.method} ${req.url?.split('?')[0]}:`, err instanceof Error ? err.message : err);
      if (!res.headersSent) res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}

export function sendPdf(res: NextApiResponse, bytes: Uint8Array, filename: string, download: boolean): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(Buffer.from(bytes));
}
