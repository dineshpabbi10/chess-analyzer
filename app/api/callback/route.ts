/**
 * Step 2 of the GitHub OAuth dance for Decap CMS.
 *
 * GitHub redirects back here with a `code`. We exchange it for an access token
 * server-side (the client secret never reaches the browser), then hand the token
 * to the Decap popup using the exact postMessage handshake it listens for:
 *
 *   1. the popup posts "authorizing:github" to us
 *   2. we reply with 'authorization:github:success:{"token":"…","provider":"github"}'
 *
 * Decap then closes the popup and starts using the token.
 */
function page(body: string) {
  return new Response(`<!doctype html><meta charset="utf-8"><body>${body}</body>`, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Clear the one-time state cookie either way.
      'Set-Cookie': 'decap_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure',
    },
  })
}

function errorPage(message: string) {
  // Escape so a provider-supplied message can't inject markup.
  const safe = message.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
  return page(
    `<p style="font:14px system-ui;padding:24px">Sign-in failed: ${safe}</p>` +
      `<script>
        (function () {
          window.addEventListener('message', function () {
            window.opener && window.opener.postMessage(
              'authorization:github:error:' + JSON.stringify({ message: ${JSON.stringify(message)} }),
              '*'
            );
          }, { once: true });
          window.opener && window.opener.postMessage('authorizing:github', '*');
        })();
      </script>`,
  )
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return errorPage('Server is missing GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.')
  }
  if (!code) return errorPage('GitHub did not return an authorization code.')

  // Verify the state cookie set in /api/auth.
  const cookie = req.headers.get('cookie') || ''
  const expected = /(?:^|;\s*)decap_oauth_state=([^;]+)/.exec(cookie)?.[1]
  if (!expected || !state || state !== expected) {
    return errorPage('Invalid OAuth state — please try signing in again.')
  }

  let token: string | undefined
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${url.origin}/api/callback`,
      }),
    })
    const data = await res.json()
    if (data.error) return errorPage(String(data.error_description || data.error))
    token = data.access_token
  } catch {
    return errorPage('Could not reach GitHub to exchange the code.')
  }
  if (!token) return errorPage('GitHub did not return an access token.')

  const payload = JSON.stringify({ token, provider: 'github' })
  return page(
    `<p style="font:14px system-ui;padding:24px">Signed in — you can close this window.</p>` +
      `<script>
        (function () {
          var message = 'authorization:github:success:' + ${JSON.stringify(payload)};
          function send() {
            // The opener is our own origin; Decap resolves it from window.location.
            window.opener && window.opener.postMessage(message, window.location.origin);
          }
          window.addEventListener('message', send, { once: true });
          // Nudge Decap to start the handshake.
          window.opener && window.opener.postMessage('authorizing:github', '*');
        })();
      </script>`,
  )
}
