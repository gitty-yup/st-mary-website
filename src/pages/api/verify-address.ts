import type { NextApiRequest, NextApiResponse } from 'next';

export interface VerifiedAddress {
  Address_Line_1: string;
  Address_Line_2: string;
  City: string;
  State: string;
  ZIP: string; // ZIP+4 format e.g. 92627-3208
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? m[1].trim() : '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { street, street2, city, state, zip } = req.body ?? {};
  if (!street || !city || !state) {
    return res.status(400).json({ error: 'Street, city, and state are required.' });
  }

  // USPS quirk: Address1 = secondary (apt/suite), Address2 = street
  const xml = `<AddressValidateRequest USERID="${process.env.USPS_USER_ID}">` +
    `<Revision>1</Revision>` +
    `<Address ID="0">` +
    `<Address1>${escapeXml((street2 ?? '').trim())}</Address1>` +
    `<Address2>${escapeXml(street.trim())}</Address2>` +
    `<City>${escapeXml(city.trim())}</City>` +
    `<State>${escapeXml(state.trim())}</State>` +
    `<Zip5>${(zip ?? '').trim().slice(0, 5)}</Zip5>` +
    `<Zip4></Zip4>` +
    `</Address>` +
    `</AddressValidateRequest>`;

  try {
    const response = await fetch(
      `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=${encodeURIComponent(xml)}`,
      { headers: { 'Accept': 'application/xml' } }
    );

    if (!response.ok) throw new Error(`USPS API ${response.status}`);
    const body = await response.text();

    // USPS returns an <Error> block if the address is invalid
    if (body.includes('<Error>')) {
      return res.status(200).json({ verified: false });
    }

    const address2 = extractTag(body, 'Address2'); // street
    const address1 = extractTag(body, 'Address1'); // apt/suite
    const city_out = extractTag(body, 'City');
    const state_out = extractTag(body, 'State');
    const zip5 = extractTag(body, 'Zip5');
    const zip4 = extractTag(body, 'Zip4');

    if (!address2 || !city_out || !state_out || !zip5) {
      return res.status(200).json({ verified: false });
    }

    // Title-case the USPS ALL-CAPS response
    const toTitle = (s: string) =>
      s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    const verified: VerifiedAddress = {
      Address_Line_1: toTitle(address2),
      Address_Line_2: toTitle(address1),
      City: toTitle(city_out),
      State: state_out.toUpperCase(),
      ZIP: zip4 ? `${zip5}-${zip4}` : zip5,
    };

    return res.status(200).json({ verified: true, address: verified });
  } catch (err) {
    console.error('[verify-address]', err);
    // Don't block submission if the service is unavailable
    return res.status(200).json({ verified: false, serviceError: true });
  }
}
