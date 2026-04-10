import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const { access_token, error } = await tokenRes.json();

  if (error || !access_token) {
    res.status(200).send(`
      <script>
        window.opener.postMessage('authorization:github:error:${error || 'unknown'}', '*');
        window.close();
      </script>
    `);
    return;
  }

  res.status(200).send(`
    <script>
      window.opener.postMessage(
        'authorization:github:success:${JSON.stringify({ token: access_token, provider: 'github' })}',
        '*'
      );
      window.close();
    </script>
  `);
}
