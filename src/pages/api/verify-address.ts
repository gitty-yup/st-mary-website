import type { NextApiRequest, NextApiResponse } from 'next';

export interface VerifiedAddress {
  Address_Line_1: string;
  Address_Line_2: string;
  City: string;
  State: string;
  ZIP: string; // ZIP+4 format e.g. 92627-3208
}

interface SmartyResult {
  delivery_line_1: string;
  delivery_line_2?: string;
  components: {
    city_name: string;
    state_abbreviation: string;
    zipcode: string;
    plus4_code?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { street, street2, city, state, zip } = req.body ?? {};
  if (!street || !city || !state) {
    return res.status(400).json({ error: 'Street, city, and state are required.' });
  }

  const params = new URLSearchParams({
    'auth-id': process.env.SMARTY_AUTH_ID!,
    'auth-token': process.env.SMARTY_AUTH_TOKEN!,
    street: street.trim(),
    city: city.trim(),
    state: state.trim(),
    candidates: '1',
    match: 'strict',
  });
  if (street2?.trim()) params.set('street2', street2.trim());
  if (zip?.trim()) params.set('zipcode', zip.trim().slice(0, 5)); // strip any existing +4 before sending

  try {
    const response = await fetch(
      `https://us-street.api.smarty.com/street-address?${params}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`Smarty ${response.status}`);

    const results: SmartyResult[] = await response.json();
    if (!results?.length) return res.status(200).json({ verified: false });

    const r = results[0];
    const c = r.components;
    const verified: VerifiedAddress = {
      Address_Line_1: r.delivery_line_1,
      Address_Line_2: r.delivery_line_2 ?? '',
      City: c.city_name,
      State: c.state_abbreviation,
      ZIP: c.plus4_code ? `${c.zipcode}-${c.plus4_code}` : c.zipcode,
    };

    return res.status(200).json({ verified: true, address: verified });
  } catch (err) {
    console.error('[verify-address]', err);
    // Don't block submission if the verification service is unavailable
    return res.status(200).json({ verified: false, serviceError: true });
  }
}
