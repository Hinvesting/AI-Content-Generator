Managing secrets

Store local secrets in `.env.local` at the project root. This file is ignored by git (see `.gitignore`) so you can safely keep development-only keys there. Do NOT commit real secrets to the repository.

- To generate a secure `NEXTAUTH_SECRET` (32 bytes hex):
  - `openssl rand -hex 32`
  - Add the output as `NEXTAUTH_SECRET=<value>` in `.env.local`.

- For client-side variables exposed to the browser with Vite, prefix them with `VITE_` (for example `VITE_STRIPE_PUBLISHABLE_KEY`).

Notes:
- `.env.local` is for local development only. Use environment-specific secret management for deployments (e.g., environment variables in your hosting provider or a secret manager).
- If you want, I already generated and injected a secure `NEXTAUTH_SECRET` into `.env.local` in this workspace.
