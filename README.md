# Sway Export

Exports a public Microsoft Sway to PDF (or Word) using Sway's built-in export, driven by Playwright.
Runs weekly on GitHub Actions and uploads the PDF as a workflow artifact.

## GitHub setup
1. Push this repo to GitHub (default branch).
2. Optional: Settings → Secrets and variables → Actions → Variables → add `SWAY_URL`. If unset, the default URL in the script is used.
3. Actions tab → "Export Sway" → Run workflow to test. Download the PDF from the run's Artifacts.

Edit the `cron` line in `.github/workflows/sway-export.yml` to change the schedule (UTC).

## Local use
```
npm install
npx playwright install chromium
npx tsx sway_export_pdf.ts "https://sway.cloud.microsoft/XXXX" -o week.pdf
npx tsx sway_export_pdf.ts --format word -o week.docx
npx tsx sway_export_pdf.ts --headed   # watch the browser
```
