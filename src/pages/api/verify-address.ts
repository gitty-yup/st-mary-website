import type { NextApiRequest, NextApiResponse } from 'next';

export interface VerifiedAddress {
  Address_Line_1: string;
  Address_Line_2: string;
  City: string;
  State: string;
  ZIP: string; // ZIP+4 format e.g. 92627-3208
}

// Cache the OAuth token in memory — Vercel warm instances reuse it,
// cold starts just fetch a new one (tokens last 1 hour)
let tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expires > now + 60_000) return tokenCache.token;

  const res = await fetch('https://api.usps.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.USPS_CLIENT_ID,
      client_secret: process.env.USPS_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) throw new Error(`USPS token error ${res.status}`);
  const data = await res.json();
  tokenCache = { token: data.access_token, expires: now + data.expires_in * 1000 };
  return tokenCache.token;
}

function toTitle(s: string): string {
  return (s ?? '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { street, street2, city, state, zip } = req.body ?? {};
  if (!street || !city || !state) {
    return res.status(400).json({ error: 'Street, city, and state are required.' });
  }

  try {
    const token = await getToken();

    const params = new URLSearchParams({
      streetAddress: street.trim(),
      city: city.trim(),
      state: state.trim(),
    });
    if (street2?.trim()) params.set('secondaryAddress', street2.trim());
    if (zip?.trim()) params.set('ZIPCode', zip.trim().slice(0, 5));

    const apiRes = await fetch(
      `https://api.usps.com/addresses/v3/address?${params}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );

    if (apiRes.status === 404) return res.status(200).json({ verified: false });
    if (!apiRes.ok) throw new Error(`USPS addresses API ${apiRes.status}`);

    const data = await apiRes.json();
    console.log('[verify-address] USPS raw:', JSON.stringify(data));
    const a = data.address;

    if (!a?.streetAddress) return res.status(200).json({ verified: false });

    const verified: VerifiedAddress = {
      Address_Line_1: toTitle(a.streetAddress),
      Address_Line_2: toTitle(a.secondaryAddress ?? ''),
      City: toTitle(a.city),
      State: (a.state ?? '').toUpperCase(),
      ZIP: a.ZIPPlus4 ? `${a.postalCode}-${a.ZIPPlus4}` : (a.postalCode ?? zip ?? ''),
    };

    return res.status(200).json({ verified: true, address: verified });
  } catch (err) {
    console.error('[verify-address]', err);
    // Never block submission if the service is unavailable
    return res.status(200).json({ verified: false, serviceError: true });
  }
}
