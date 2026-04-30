# Deployment Runbook

This repo owns the project portal. The portal production target is the Vercel project named `crypto-raid-admin-portal`. The old `admin-portal` Vercel project is not a valid production target and should stay unused.

## Canonical Project

| Surface | Vercel project | Production URL | Production branch |
| --- | --- | --- | --- |
| Portal | `crypto-raid-admin-portal` | `https://crypto-raid-admin-portal.vercel.app` | `main` |

## Release Contract

1. Build feature work on `codex/*` branches.
2. Merge verified portal changes into `main`.
3. Run the portal build from a clean `main` checkout.
4. Push `main` and let Vercel deploy from Git.
5. Use direct `vercel --prod` deploys only for emergencies, only from a clean `main` checkout, and immediately follow up by pushing the same commit to `origin/main`.

## Safe Commands

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git status --short --branch
npm run build
git push origin main
```

Check the live deployment after release:

```powershell
npx --yes vercel@52.2.0 inspect https://crypto-raid-admin-portal.vercel.app
```

## Guardrails

- Do not deploy to a Vercel project named `admin-portal`.
- Do not deploy from a dirty worktree.
- Do not treat preview deployments as production proof.
- If a production deploy is created from a feature branch, align `main` with that exact commit before continuing new work.
