import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs/promises';
import chromium from '@sparticuz/chromium'; import puppeteer from 'puppeteer-core';

test('bundled Chromium launches and renders content', async () => {
  await fs.mkdir('/tmp/fonts', { recursive: true }); const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({ args: chromium.args, executablePath, headless: true });
  try { const page = await browser.newPage(); await page.setContent('<h1 id="ok">GEOv4 Publisher Ready</h1>'); assert.equal(await page.$eval('#ok', (element) => element.textContent), 'GEOv4 Publisher Ready'); assert.match(await browser.version(), /Chrom|Headless/i); }
  finally { await browser.close(); }
});
