# Mac Setup + Travel Handoff

> Created 2026-05-29 for one week of mobile-data travel development.

## Option A: SSH to Home PC (Recommended — ~5-50 KB/hr)

Your Windows PC has everything. SSH sends only text.

### Step 1: Install Tailscale on Mac

```bash
# Download from https://tailscale.com/download/mac
# Or App Store: "Tailscale"
# Sign in with same account as PC
```

### Step 2: SSH to PC

```bash
ssh user@100.115.4.2
cd "My Drive/Documents/MSC/Development/donttouchpurple/deploy-ready"
pnpm dev
```

That's it. All skills, MCP, memory, env vars already on PC.

### Step 3: Open Claude on Mac (optional — for AI chat while SSH'd)

```bash
# Install OpenClaude on Mac if not done
npm install -g openclaude

# Run from any dir
openclaude
```

**Data usage**: Essentially zero. Text terminal only.

---

## Option B: Full Local Mac Setup (if PC is off / you want offline)

Run `bash mac-setup.sh` from this directory. It installs everything.

After setup, clone and go:

```bash
git clone https://github.com/defaltadmin/donttouchpurple.git
cd donttouchpurple
pnpm install
pnpm dev
```

**Data usage**: ~200 MB one-time clone + install. Then zero (local dev).

---

## Option C: GitHub Codespaces (backup)

```bash
gh codespace ssh
# or
gh codespace code
```

**Data usage**: ~10 MB/hour (VS Code remote). More than raw SSH.

---

## What's in This Package

| File | Purpose |
|------|---------|
| `mac-setup.sh` | One-shot Mac environment setup |
| `MAC_HANDOFF.md` | This file — read first |
| `mcp-config.json` | MCP servers (codegraph + agentmemory) |
| `skills-export.md` | All 50+ skills with install commands |
| `CLAUDE.md.export` | Project instructions for OpenClaude |
| `MEMORY-EXPORT.md` | Key memories to import |
| `ssh-config` | SSH config for Tailscale to home PC |

## Commands Cheat Sheet

```bash
pnpm dev          # Dev server
pnpm typecheck    # TypeScript validation
pnpm test         # Unit tests (214 tests)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Production build
pnpm lint         # ESLint fix
firebase deploy --only hosting  # Deploy to game.mscarabia.com
```

## Mobile Data Tips

1. **Use SSH**, not Codespaces or local clone if possible
2. **Disable auto-fetch** in git: `git config --global fetch.autoFetch false`
3. **Shallow clone** if going local: `git clone --depth 1`
4. **Skip `pnpm install` on metered** — do it on hotel WiFi
5. **SSH multiplexing** — add to `~/.ssh/config`:
   ```
   Host 100.115.4.2
     ControlMaster auto
     ControlPath ~/.ssh/sockets/%r@%h-%p
     ControlPersist 600
   ```
   First connection uses data; subsequent ones reuse the tunnel.
6. **Mosh** as SSH backup — survives network drops:
   ```bash
   brew install mosh
   mosh user@100.115.4.2
   ```
