# Skills Export — Install on Mac

## Project Skills (in .openclaude/skills/)

### GSAP (8 skills)
```bash
npx openskills install gsap-core
npx openskills install gsap-frameworks
npx openskills install gsap-performance
npx openskills install gsap-plugins
npx openskills install gsap-react
npx openskills install gsap-scrolltrigger
npx openskills install gsap-timeline
npx openskills install gsap-utils
```

### Security (15 skills)
```bash
npx openskills install testing-for-xss-vulnerabilities
npx openskills install performing-csrf-attack-simulation
npx openskills install testing-cors-misconfiguration
npx openskills install performing-content-security-policy-bypass
npx openskills install conducting-api-security-testing
npx openskills install implementing-api-rate-limiting-and-throttling
npx openskills install implementing-api-key-security-controls
npx openskills install testing-api-security-with-owasp-top-10
npx openskills install exploiting-websocket-vulnerabilities
npx openskills install implementing-api-schema-validation-security
npx openskills install detecting-sql-injection-via-waf-logs
npx openskills install exploiting-nosql-injection-vulnerabilities
npx openskills install analyzing-api-gateway-access-logs
npx openskills install implementing-api-abuse-detection-with-rate-limiting
npx openskills install testing-websocket-api-security
```

## Global Skills (in ~/.openclaude/skills/)

### Core Dev (20 skills)
```bash
npx openskills install caveman
npx openskills install ci-fix
npx openskills install codeql-fix
npx openskills install commit-message-craft
npx openskills install database-review
npx openskills install debugging
npx openskills install diagnose
npx openskills install dockerfile-review
npx openskills install docs-writer
npx openskills install error-message-decode
npx openskills install frontend-implementation
npx openskills install git-conflict-resolve
npx openskills install git-guardrails-claude-code
npx openskills install grill-me
npx openskills install grill-with-docs
npx openskills install handoff
npx openskills install improve-codebase-architecture
npx openskills install local-model-picker
npx openskills install loop-task-author
npx openskills install mcp-server-pick
```

### Advanced (20 skills)
```bash
npx openskills install migrate-to-shoehorn
npx openskills install nextjs-hydration-fix
npx openskills install pr-description-writer
npx openskills install pr-review
npx openskills install prompt-master
npx openskills install prototype
npx openskills install provider-debug
npx openskills install provider-setup
npx openskills install refactor-plan
npx openskills install regex-craft
npx openskills install release-maintainer
npx openskills install scaffold-exercises
npx openskills install security-audit
npx openskills install setup-pre-commit
npx openskills install stripe-webhook-setup
npx openskills install subagent-design
npx openskills install supabase-rls-audit
npx openskills install tdd
npx openskills install test-writer
npx openskills install to-issues
```

### Workflow (10 skills)
```bash
npx openskills install to-prd
npx openskills install triage
npx openskills install vercel-build-fail-decode
npx openskills install write-a-skill
npx openskills install react-best-practices
npx openskills install playwright-best-practices
npx openskills install vitest
npx openskills install vite
npx openskills install typescript-advanced-types
npx openskills install nodejs-best-practices
```

### Marketing (40+ skills)
```bash
# Install all at once
npx openskills install marketingskills
```

## Batch Install Script

```bash
#!/bin/bash
# Run from project root after pnpm install

SKILLS=(
  gsap-core gsap-frameworks gsap-performance gsap-plugins gsap-react gsap-scrolltrigger gsap-timeline gsap-utils
  testing-for-xss-vulnerabilities performing-csrf-attack-simulation testing-cors-misconfiguration performing-content-security-policy-bypass conducting-api-security-testing implementing-api-rate-limiting-and-throttling implementing-api-key-security-controls testing-api-security-with-owasp-top-10 exploiting-websocket-vulnerabilities implementing-api-schema-validation-security detecting-sql-injection-via-waf-logs exploiting-nosql-injection-vulnerabilities analyzing-api-gateway-access-logs implementing-api-abuse-detection-with-rate-limiting testing-websocket-api-security
  caveman ci-fix codeql-fix commit-message-craft database-review debugging diagnose dockerfile-review docs-writer error-message-decode frontend-implementation git-conflict-resolve git-guardrails-claude-code grill-me grill-with-docs handoff improve-codebase-architecture local-model-picker loop-task-author mcp-server-pick
  migrate-to-shoehorn nextjs-hydration-fix pr-description-writer pr-review prompt-master prototype provider-debug provider-setup refactor-plan regex-craft release-maintainer scaffold-exercises security-audit setup-pre-commit stripe-webhook-setup subagent-design supabase-rls-audit tdd test-writer to-issues
  to-prd triage vercel-build-fail-decode write-a-skill react-best-practices playwright-best-practices vitest vite typescript-advanced-types nodejs-best-practices
)

for skill in "${SKILLS[@]}"; do
  echo "Installing $skill..."
  npx openskills install "$skill" 2>/dev/null || echo "  Failed: $skill"
done

echo "Done! ${#SKILLS[@]} skills processed."
```
