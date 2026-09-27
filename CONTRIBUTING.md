# Contributing to The Book Club

Thank you for your interest in contributing to The Book Club. This project is open source and licensed under the GNU General Public License v3.0 (GPLv3).

## Code of Conduct

All contributors and maintainers are expected to adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

1. **Prerequisites:**
   - Node.js (v22 or newer)
   - npm (v10 or newer)

2. **Installation:**
   ```bash
   npm install --ignore-scripts
   ```

3. **Development Server:**
   ```bash
   npm run dev
   ```

4. **Static Analysis & Testing:**
   ```bash
   # Linting and formatting
   npx @biomejs/biome check --write

   # Type checking
   npx svelte-check --tsconfig ./tsconfig.json

   # Unit test runner
   npx vitest run
   ```

## Development Guidelines

- **Design System:** Follow the tactile geometric design system defined in `PROJECT.md`. Never use gradients, glows, or blurry drop shadows.
- **Dependencies:** All dependencies must be pinned to exact versions with no floating ranges (`^` or `~`). New dependencies require maintainer approval.
- **Constants:** Never hardcode numbers or strings. Centralize all thresholds and settings in `src/lib/constants/`.
- **Commit Messages:** Follow the Conventional Commits format as specified in `AGENTS.md`.

## Pull Request Process

1. Create a descriptive feature branch from `main`.
2. Ensure all lint checks, type checks, and tests pass before submitting.
3. Open a Pull Request using the provided pull request template.
