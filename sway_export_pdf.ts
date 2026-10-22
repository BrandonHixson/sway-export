#!/usr/bin/env npx tsx
/**
 * Download a public Microsoft Sway as a PDF using Sway's own built-in export
 * (the same thing as: ... menu -> Export -> PDF).
 *
 * Setup (one time):
 *     npm install playwright
 *     npm install -D typescript tsx @types/node
 *     npx playwright install chromium
 *
 * Usage:
 *     npx tsx sway_export_pdf.ts
 *     npx tsx sway_export_pdf.ts "https://sway.cloud.microsoft/XXXX" -o week.pdf
 *     npx tsx sway_export_pdf.ts --format word -o week.docx
 *     npx tsx sway_export_pdf.ts --headed        # watch the browser, useful for debugging
 *
 * Works for Sways shared publicly / "anyone with the link" (no sign-in needed).
 */

import { parseArgs } from "node:util";
import { chromium, errors } from "playwright";

const DEFAULT_URL = "https://sway.cloud.microsoft/QPH9oAu9FZCt9NNJ?ref=Link&loc=play";

type ExportFormat = "pdf" | "word";

interface ExportOptions {
  url: string;
  output: string;
  fmt?: ExportFormat;
  headed?: boolean;
  timeoutMs?: number;
}

async function exportSway({
  url,
  output,
  fmt = "pdf",
  headed = false,
  timeoutMs = 120_000,
}: ExportOptions): Promise<void> {
  const label = fmt === "pdf" ? "PDF" : "Word";

  const browser = await chromium.launch({ headless: !headed });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      acceptDownloads: true,
    });
    const page = await context.newPage();

    console.log(`Opening ${url} ...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });

    // 1) "More Sway options" (the ... button)
    const more = page.getByRole("button", { name: /More Sway options/i }).first();
    await more.waitFor({ state: "visible", timeout: 60_000 });
    await more.click();

    // 2) "Export" menu item
    const exportItem = page.getByText("Export", { exact: true }).first();
    await exportItem.waitFor({ state: "visible", timeout: 15_000 });
    await exportItem.click();

    // 3) Choose the format in the "Export your Sway" dialog and catch the download
    console.log(`Requesting ${label} export ...`);
    let fmtButton = page.getByRole("button", { name: label, exact: true });
    if ((await fmtButton.count()) === 0) {
      // some builds render these as plain elements
      fmtButton = page.getByText(label, { exact: true });
    }
    fmtButton = fmtButton.first();
    await fmtButton.waitFor({ state: "visible", timeout: 15_000 });

    let download;
    try {
      [download] = await Promise.all([
        page.waitForEvent("download", { timeout: timeoutMs }),
        fmtButton.click(),
      ]);
    } catch (err) {
      if (err instanceof errors.TimeoutError) {
        throw new Error(
          "Timed out waiting for the export download. The Sway may not allow " +
            "exporting, or it needs a sign-in. Try again with --headed."
        );
      }
      throw err;
    }

    await download.saveAs(output);
    console.log(`Saved: ${output}  (server filename: ${download.suggestedFilename()})`);
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string", short: "o" },
      format: { type: "string", default: "pdf" },
      headed: { type: "boolean", default: false },
    },
  });

  const fmt = values.format as string;
  if (fmt !== "pdf" && fmt !== "word") {
    throw new Error(`Invalid --format "${fmt}". Choose "pdf" or "word".`);
  }

  const url = positionals[0] ?? DEFAULT_URL;
  const output = values.output ?? (fmt === "pdf" ? "sway.pdf" : "sway.docx");

  await exportSway({ url, output, fmt, headed: values.headed });
}

main().catch((err: unknown) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
