import jwt from 'jsonwebtoken';

const SECRET = process.env.MAGIC_LINK_SECRET!;

export interface MagicLinkPayload {
  email: string;
  rowIndex: number;
}

export function signToken(payload: MagicLinkPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' });
}

export function verifyToken(token: string): MagicLinkPayload {
  return jwt.verify(token, SECRET) as MagicLinkPayload;
}
