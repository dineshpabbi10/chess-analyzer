# Blog + CMS setup

Posts are Markdown files in `content/blog/` with YAML frontmatter. You can write
them two ways — both produce identical files, so mix freely:

1. **In the browser** at `/admin` (Decap CMS), which commits to GitHub for you.
2. **By hand** — create `content/blog/my-post.md` and commit it.

Either way the post is statically generated at build time, with its own `<title>`,
meta description, canonical URL, OpenGraph tags and `BlogPosting` structured data.

---

## One-time setup for `/admin`

Decap CMS talks to GitHub on your behalf, so GitHub needs to know about the site.
This site implements the OAuth exchange itself (`app/api/auth`, `app/api/callback`),
so **no third-party auth proxy is required** — but you do need to create a GitHub
OAuth app and give the site its credentials.

### 1. Create a GitHub OAuth app

Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
(<https://github.com/settings/developers>) and enter:

| Field | Value |
| --- | --- |
| Application name | `Fast Chess Analyzer CMS` (anything) |
| Homepage URL | `https://chess-analyzer-ruddy.vercel.app` |
| Authorization callback URL | `https://chess-analyzer-ruddy.vercel.app/api/callback` |

The callback URL must match **exactly**, including `https://` and no trailing slash.

Then click **Generate a new client secret**.

### 2. Add the credentials to Vercel

In your Vercel project → **Settings → Environment Variables**, add both for
*Production* (and *Preview* if you want `/admin` on preview deploys):

| Name | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | the Client ID from step 1 |
| `GITHUB_CLIENT_SECRET` | the client secret from step 1 |

> Treat the client secret like a password: paste it straight into Vercel, don't
> commit it, and don't paste it into chat or a file. If it ever leaks, revoke it on
> the GitHub OAuth app page and generate a new one.

Redeploy so the new variables take effect.

### 3. Check the repo details in `public/admin/config.yml`

```yaml
backend:
  name: github
  repo: dineshpabbi10/chess-analyzer   # must be owner/repo
  branch: main
  base_url: https://chess-analyzer-ruddy.vercel.app
  auth_endpoint: api/auth
```

If you move the site to a custom domain, update `base_url` here **and** the two
URLs on the GitHub OAuth app.

---

## Writing a post

Visit `/admin`, sign in with GitHub, and click **New Blog post**. Fields:

- **Title** — also used as the `<h1>` and the `<title>`.
- **Meta description** — shown in Google results and on the blog index. Aim for
  120–160 characters; write it as a promise of what the reader gets.
- **Publish date** — posts are ordered newest first.
- **Tags** — optional, shown as chips.
- **Cover image** — optional; used for social sharing previews. Uploads are
  committed to `public/uploads/`.
- **Draft** — hidden on the live site, visible when running locally.
- **Body** — Markdown. Headings (`##`), lists, tables, `code`, links and images
  are all styled.

`publish_mode: editorial_workflow` is enabled, so saving creates a **pull request**
rather than committing to `main` directly. Use the CMS's *Workflow* tab to move a
post from Draft → In review → Ready, and publishing merges the PR. If you'd rather
commit straight to `main`, delete that line from `config.yml`.

### Internal links help SEO

Link to the tools from inside posts — `[review a game](/)`,
`[Analysis Board](/tools/analysis)`, `[Coach](/coach)`. It gives readers the next
step and helps search engines understand how the site fits together.

---

## Local development

```bash
nvm use            # Node 20, per .nvmrc
npm run dev
```

- Blog: <http://localhost:3000/blog>
- Drafts are visible locally and hidden in production.

`/admin` will not authenticate against `localhost` unless you also register a
second OAuth app whose callback is `http://localhost:3000/api/callback` and set the
env vars in a local `.env.local`. It's usually easier to write Markdown files
directly while developing.

---

## Troubleshooting

**"Sign-in failed: Invalid OAuth state"** — the one-time state cookie expired
(10 minutes) or third-party cookies are blocked. Close the popup and retry.

**Popup opens then nothing happens** — `base_url` in `config.yml` doesn't match the
site you're on, so the token is posted to a different origin. They must be identical.

**"Server is missing GITHUB_CLIENT_ID"** — the env vars aren't set on the
deployment you're using, or you haven't redeployed since adding them.

**Post saved but not on the site** — with `editorial_workflow` the post sits in a PR
until you publish it. Check the Workflow tab. Also confirm **Draft** is off.
