# Sway Export

Exports public Microsoft Sways to PDF (or Word) using Sway's built-in export, driven by Playwright.
Runs weekly on GitHub Actions and uploads the PDFs as a workflow artifact.

## GitHub setup
1. Push this repo to GitHub (default branch).
2. Optional: Settings → Secrets and variables → Actions → Variables → add `SWAY_URL`. Put **one URL per line** to export several Sways (blank lines are ignored). If unset, the default URL in the script is used.
3. Actions tab → "Export Sway" → Run workflow to test. Download the PDFs from the run's Artifacts (`sway-pdf`), named `01-<id>.pdf`, `02-<id>.pdf`, ... in the order listed.

If one URL fails, the others still export and the run is marked failed.

Edit the `cron` line in `.github/workflows/sway-export.yml` to change the schedule (UTC).

## Local use
```
npm install
npx playwright install chromium
npx tsx sway_export_pdf.ts "https://sway.cloud.microsoft/XXXX" -o week.pdf
npx tsx sway_export_pdf.ts --format word -o week.docx
npx tsx sway_export_pdf.ts --headed   # watch the browser
```
