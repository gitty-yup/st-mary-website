import type { NextApiRequest, NextApiResponse } from 'next';

export interface VerifiedAddress {
  Address_Line_1: string;
  Address_Line_2: string;
  City: string;
  State: string;
  ZIP: string; // ZIP+4 format e.g. 92627-3208 when available
}

function toTitle(s: string): string {
  return (s ?? '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const GOOD_ACCURACY = new Set(['rooftop', 'point', 'range_interpolation']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { street, street2, city, state, zip } = req.body ?? {};
  if (!street || !city || !state) {
    return res.status(400).json({ error: 'Street, city, and state are required.' });
  }

  try {
    const q = [
      street.trim(),
      street2?.trim() || null,
      `${city.trim()}, ${state.trim()} ${(zip ?? '').trim()}`,
    ]
      .filter(Boolean)
      .join(' ');

    const params = new URLSearchParams({
      q,
      api_key: process.env.GEOCODIO_API_KEY ?? '',
      fields: 'zip4',
    });

    const apiRes = await fetch(`https://api.geocod.io/v1.7/geocode?${params}`);
    if (!apiRes.ok) throw new Error(`Geocodio API ${apiRes.status}`);

    const data = await apiRes.json();
    const top0 = data.results?.[0];
    console.log('[verify-address] ac:', JSON.stringify(top0?.address_components));
    console.log('[verify-address] fields:', JSON.stringify(top0?.fields));
    console.log('[verify-address] accuracy:', top0?.accuracy_type);

    const results: any[] = data.results ?? [];
    if (!results.length) return res.status(200).json({ verified: false });

    const top = results[0];
    const ac = top.address_components;

    if (!GOOD_ACCURACY.has(top.accuracy_type) || !ac?.zip) {
      return res.status(200).json({ verified: false });
    }

    // fields.zip4.zip4 is the USPS CASS lookup; ac.zip4 is Geocodio's own data
    const zip4ext = top.fields?.zip4?.zip4 ?? ac.zip4;
    const zipFull = zip4ext ? `${ac.zip}-${zip4ext}` : ac.zip;
    // formatted_address = "148 22nd St, Costa Mesa, CA 92627" — take the street portion
    const streetPart = (top.formatted_address ?? '').split(',')[0].trim();

    const verified: VerifiedAddress = {
      Address_Line_1: toTitle(streetPart || `${ac.number ?? ''} ${ac.formatted_street ?? ''}`.trim()),
      Address_Line_2: toTitle((street2 ?? '').trim()), // Geocodio doesn't parse secondary; preserve user's input
      City: toTitle(ac.city ?? ''),
      State: (ac.state ?? '').toUpperCase(),
      ZIP: zipFull,
    };

    return res.status(200).json({ verified: true, address: verified });
  } catch (err) {
    console.error('[verify-address]', err);
    return res.status(200).json({ verified: false, serviceError: true });
  }
}
