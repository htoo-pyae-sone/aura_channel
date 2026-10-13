## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Shipping

Verify before proposing any commit:

```
npm run verify
```

That is exactly what CI runs: `check:css` (prefixed-property ordering),
`check:ratchet` (type errors vs baseline), `build`, `smoke`. All four must
pass. `astro check` alone exits 1 at the current baseline — use
`npm run check:ratchet` to judge the count, or `npm run check` to read the
errors.

**Do not push `main` directly.** Branch protection on `main` requires a PR
and a passing `Build & verify` run, with an empty bypass list — direct
pushes are rejected for everyone including the repo owner. The old
`git branch -f main dev/hps && git push origin main` flow no longer works.
`origin/dev/hps` is pushed now; the "never push dev/hps" convention is
retired because it has to be the PR source.

```
git push origin dev/hps
gh pr create --base main --head dev/hps --fill
gh pr merge dev/hps --squash     # after CI goes green
git fetch origin
git branch -f main origin/main
git checkout dev/hps && git reset --hard origin/main
```

The last line is the one that gets skipped. A squash merge writes new SHAs
into `main`, so without it `dev/hps` and `main` diverge permanently — and
because `strict` up-to-date is on, every later PR then demands an "update
branch" that conflicts with changes it already merged. The reset keeps the
two branches in lockstep, which is the relationship this repo always had.

The 167-error type baseline lives in `scripts/check-ratchet.mjs`. Lower it
when the count drops. Never raise it without a commit explaining what was
added.

Deployment is Vercel building `main`, taking roughly ten minutes. CI does
not gate it — a red run reports a bad push rather than preventing one.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
