#!/bin/bash
# Mac Setup Script for DTP Development
# Run: bash mac-setup.sh

set -e

echo "=== DTP Mac Setup ==="

# 1. Homebrew
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 2. Core tools
echo "Installing core tools..."
brew install node@22 pnpm git gh

# 3. Firebase CLI
echo "Installing Firebase CLI..."
npm install -g firebase-tools

# 4. OpenClaude
echo "Installing OpenClaude..."
npm install -g openclaude

# 5. MCP Servers
echo "Installing MCP servers..."
npm install -g @agentmemory/agentmemory
# codegraph: install from GitHub or npm if available
# npm install -g codegraph  # uncomment if published

# 6. SSH config for Tailscale
echo "Setting up SSH config..."
mkdir -p ~/.ssh/sockets
cat >> ~/.ssh/config << 'EOF'

# Home PC via Tailscale
Host home-pc
  HostName 100.115.4.2
  User user
  IdentityFile ~/.ssh/id_ed25519
  ControlMaster auto
  ControlPath ~/.ssh/sockets/%r@%h-%p
  ControlPersist 600
EOF

# 7. Clone DTP repo
echo "Cloning DTP repo..."
cd ~
git clone https://github.com/defaltadmin/donttouchpurple.git
cd donttouchpurple
pnpm install

# 8. Project skills
echo "Installing project skills..."
mkdir -p .openclaude/skills

# GSAP skills (8)
for skill in gsap-core gsap-frameworks gsap-performance gsap-plugins gsap-react gsap-scrolltrigger gsap-timeline gsap-utils; do
  npx openskills install "$skill" 2>/dev/null || echo "  Skip $skill (install manually)"
done

# Security skills (15)
for skill in testing-for-xss-vulnerabilities performing-csrf-attack-simulation testing-cors-misconfiguration performing-content-security-policy-bypass conducting-api-security-testing implementing-api-rate-limiting-and-throttling implementing-api-key-security-controls testing-api-security-with-owasp-top-10 exploiting-websocket-vulnerabilities implementing-api-schema-validation-security detecting-sql-injection-via-waf-logs exploiting-nosql-injection-vulnerabilities analyzing-api-gateway-access-logs implementing-api-abuse-detection-with-rate-limiting testing-websocket-api-security; do
  npx openskills install "$skill" 2>/dev/null || echo "  Skip $skill (install manually)"
done

# 9. Global skills
echo "Installing global skills..."
for skill in caveman ci-fix codeql-fix commit-message-craft database-review debugging diagnose dockerfile-review docs-writer error-message-decode frontend-implementation git-conflict-resolve git-guardrails-claude-code grill-me grill-with-docs handoff improve-codebase-architecture local-model-picker loop-task-author mcp-server-pick migrate-to-shoehorn nextjs-hydration-fix pr-description-writer pr-review prompt-master prototype provider-debug provider-setup refactor-plan regex-craft release-maintainer scaffold-exercises security-audit setup-pre-commit stripe-webhook-setup subagent-design supabase-rls-audit tdd test-writer to-issues to-prd triage vercel-build-fail-decode write-a-skill; do
  npx openskills install "$skill" 2>/dev/null || echo "  Skip $skill (install manually)"
done

# 10. MCP setup
echo "Configuring MCP servers..."
cat > .openclaude.json << 'MCPEOF'
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    },
    "agentmemory": {
      "type": "stdio",
      "command": "npx",
      "args": ["@agentmemory/agentmemory", "mcp"]
    }
  }
}
MCPEOF

# 11. OpenClaude settings
mkdir -p ~/.openclaude
cat > ~/.openclaude/settings.json << 'SETTINGSEOF'
{
  "env": {
    "ENABLE_TOOL_SEARCH": "true"
  },
  "autoUpdatesChannel": "latest",
  "skipDangerousModePermissionPrompt": true
}
SETTINGSEOF

# 12. Environment file
cat > .env << 'ENVEOF'
# Firebase (public identifiers, not secrets)
VITE_FIREBASE_API_KEY=your-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# Sentry (public DSN, not a secret)
VITE_SENTRY_DSN=your-sentry-dsn

# Resend (secret — get from CF Pages env vars or .env.local)
RESEND_API_KEY=your-resend-key
ENVEOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your actual keys"
echo "  2. Run: pnpm dev"
echo "  3. Or SSH to PC: ssh home-pc"
echo ""
echo "Skills installed: 50+"
echo "MCP servers: codegraph, agentmemory"
echo "Repo: donttouchpurple"
