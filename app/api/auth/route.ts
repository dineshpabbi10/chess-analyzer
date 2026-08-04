import { randomBytes } from 'node:crypto'

/**
 * Step 1 of the GitHub OAuth dance for Decap CMS.
 *
 * Decap opens this in a popup; we bounce the user to GitHub's consent screen and
 * remember a one-time `state` in a cookie so the callback can prove the response
 * belongs to this request (CSRF protection).
 */
export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return new Response(
      'GITHUB_CLIENT_ID is not set. See docs/cms-setup.md for the one-time setup.',
      { status: 500 },
    )
  }

  const origin = new URL(req.url).origin
  const state = randomBytes(16).toString('hex')

  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  authorize.searchParams.set('redirect_uri', `${origin}/api/callback`)
  // `repo` is required: the CMS commits posts and uploads to the repository.
  authorize.searchParams.set('scope', 'repo,user')
  authorize.searchParams.set('state', state)

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `decap_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`,
    },
  })
}
