import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Missing code');
    return;
  }

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
    res.status(200).send(`<!DOCTYPE html><html><body><script>
      window.opener && window.opener.postMessage('authorization:github:error:${error || 'unknown'}', '*');
      window.close();
    </script></body></html>`);
    return;
  }

  // Decap CMS netlify-auth handshake protocol:
  // 1. Popup sends 'authorizing:github' to opener
  // 2. CMS receives it, echoes 'authorizing:github' back to the popup
  // 3. Popup receives the echo, sends 'authorization:github:success:{token}' to opener
  // 4. CMS logs in and closes the popup
  res.status(200).send(`<!DOCTYPE html><html><body><script>
    (function() {
      var token = ${JSON.stringify(access_token)};
      var provider = 'github';
      var message = 'authorization:' + provider + ':success:' + JSON.stringify({ token: token, provider: provider });

      function onMessage(e) {
        if (e.data === 'authorizing:' + provider) {
          window.removeEventListener('message', onMessage);
          e.source.postMessage(message, e.origin);
        }
      }
      window.addEventListener('message', onMessage, false);

      // Step 1: tell the opener we are authorizing
      if (window.opener) {
        window.opener.postMessage('authorizing:' + provider, '*');
      }
    })();
  </script></body></html>`);
}
