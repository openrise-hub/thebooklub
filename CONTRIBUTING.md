# Contributing to The Book Club

Thanks for helping out! The Book Club is open source under the GNU General Public License v3.0 (GPLv3).

## Code of Conduct

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all project spaces.

## Setup

1. **Requirements:** Node.js 22+ and npm 10+.
2. **Install:**
   ```bash
   npm install --ignore-scripts
   ```
3. **Run locally:**
   ```bash
   npm run dev
   ```

## Checks & Tests

Run these before opening a pull request:

```bash
# Format and lint
npm run lint

# Type check
npm run check

# Tests
npm run test
```

## Pull Requests

1. Branch off `main` with a short, descriptive name.
2. Write commit messages following Conventional Commits (`type(scope): subject`).
3. Add unit tests for new logic or fixes.
4. Open a pull request using the default template.
