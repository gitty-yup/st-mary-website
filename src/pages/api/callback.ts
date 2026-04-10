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

  // Decap CMS polls the popup with "requesting:github" every 500ms.
  // The popup must listen for that message and reply with the token.
  res.status(200).send(`<!DOCTYPE html><html><body><script>
    (function() {
      var token = ${JSON.stringify(access_token)};
      var provider = 'github';
      var message = 'authorization:' + provider + ':success:' + JSON.stringify({ token: token, provider: provider });

      function onMessage(e) {
        if (e.data === 'requesting:' + provider) {
          window.removeEventListener('message', onMessage);
          e.source.postMessage(message, e.origin);
          setTimeout(function() { window.close(); }, 500);
        }
      }
      window.addEventListener('message', onMessage, false);

      // Also send immediately in case the CMS already sent its ping
      if (window.opener) {
        window.opener.postMessage('authorizing:' + provider, '*');
      }
    })();
  </script></body></html>`);
}
