# The Book Club

A web application for organizing and managing book clubs. It enables members to search for books, vote on upcoming selections, read PDFs in the browser, discuss chapters without spoilers, and track reading progress.

## Features

- **Book Discovery**: Search titles, authors, and ISBNs using Google Books with automatic fallback to Open Library.
- **Book Selection**: Select upcoming books using a roulette wheel or timed secret ballots.
- **PDF Reader**: View uploaded reading material directly in an in-browser canvas viewer.
- **Spoiler-Filtered Discussions**: Post messages tagged with page numbers. Content beyond a member's current progress is blurred until clicked.
- **Reading Progress Tracking**: Visual progress bar showing reading completion across all members.
- **Reviews & Ratings**: Submit star ratings and criteria-based reviews (plot, characters, pacing, writing, emotion).
- **History Archive**: Browse completed reading cycles, discussions, and past reviews.
- **Data Export & QR Codes**: Export club history to CSV and JSON, and generate invite QR codes.
- **Localization**: English and Spanish support with automatic browser detection and manual toggle.

## Tech Stack

- **Framework**: SvelteKit 2 and Svelte 5
- **Language**: TypeScript
- **Linter & Formatter**: Biome
- **Test Runner**: Vitest
- **Storage**: Cloudflare R2
- **Localization**: Paraglide JS

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm 10 or newer

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/openrise-hub/thebooklub.git
   cd thebooklub
   ```

2. Install dependencies:
   ```bash
   npm install --ignore-scripts
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Development Commands

```bash
# Format and lint check
npm run lint

# Format and lint fix
npm run lint:fix

# Type check
npm run check

# Run tests
npm run test

# Production build
npm run build
```

## Deployment

### Vercel
1. Import repository on Vercel.
2. SvelteKit preset is detected automatically.
3. Add required environment variables (`AUTH_SECRET`, `AUTH_PROVIDER`, `CRON_SECRET`).

### Cloudflare Pages
1. Connect repository in Cloudflare Pages dashboard.
2. Build command: `npm run build`
3. Output directory: `.svelte-kit/cloudflare`
4. Configure environment variables from `.env.example`.

## Contributing

Review [CONTRIBUTING.md](CONTRIBUTING.md) for setup and pull request instructions.

## License

GNU General Public License v3.0 (GPLv3). See [LICENSE](LICENSE) for details.