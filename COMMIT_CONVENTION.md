# Commit Message Convention

This project uses [Conventional Commits](https://conventionalcommits.org/) for automated version management and changelog generation.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

## Scopes

- `game-engine` - Game logic and engine
- `ui` - User interface components
- `firebase` - Firebase integration
- `analytics` - Analytics and tracking
- `input` - Input handling
- `audio` - Audio system
- `build` - Build system and tooling
- `test` - Testing infrastructure

## Examples

```
feat: add powerup system
fix(game-engine): prevent double powerup consumption
docs: update README with new features
refactor(ui): extract screen state machine
perf: optimize cell rendering with RAF
test: add leaderboard service tests
build: add semantic-release configuration
```

## Breaking Changes

Mark breaking changes with `!` after the type/scope:

```
feat!: change API for powerup system
```

## Why Conventional Commits?

- **Automated Versioning**: Patch, minor, or major version bumps based on commit types
- **Changelog Generation**: Automatic changelog creation from commit messages
- **Release Management**: Semantic versioning with GitHub releases
- **Developer Experience**: Clear commit history and release notes