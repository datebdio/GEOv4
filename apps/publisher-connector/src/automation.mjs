import fs from 'node:fs/promises'; import path from 'node:path';
import chromium from '@sparticuz/chromium'; import puppeteer from 'puppeteer-core'; import { platforms } from './platforms.mjs';

async function firstVisible(page, selectors) { for (const selector of selectors) { const handle = await page.$(selector); if (handle && await handle.isVisible()) return handle; } throw new Error(`selector_not_found:${selectors.join(',')}`); }
async function clickText(page, labels) { const clicked = await page.evaluate((values) => { const nodes = [...document.querySelectorAll('button,a,div[role="button"]')]; const node = nodes.find((item) => values.some((value) => item.textContent?.trim().includes(value))); if (node instanceof HTMLElement) { node.click(); return true; } return false; }, labels); if (!clicked) throw new Error(`action_not_found:${labels.join(',')}`); }

export async function publishWithBrowser(input, config) {
  const platform = platforms[input.platform]; if (!platform) throw new Error('unsupported_platform');
  const profile = path.join(config.dataDir, 'profiles', input.platform, input.account.replace(/[^a-zA-Z0-9_.-]/g, '_')); await fs.mkdir(profile, { recursive: true });
  await fs.mkdir('/tmp/fonts', { recursive: true });
  const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: config.headless, userDataDir: profile, defaultViewport: { width: 1440, height: 1000 } });
  const page = (await browser.pages())[0] ?? await browser.newPage();
  try {
    await page.goto(platform.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (/login|passport|signin|auth/i.test(page.url())) throw new Error('account_authentication_required');
    const title = await firstVisible(page, platform.title); await title.click({ clickCount: 3 }); await title.type(input.title);
    const editor = await firstVisible(page, platform.editor); await editor.click(); await page.keyboard.type(input.markdown);
    const action = config.mode === 'publish' ? platform.publish : platform.draft; await clickText(page, action); await new Promise((resolve) => setTimeout(resolve, 3000));
    const evidenceDir = path.join(config.dataDir, 'evidence'); await fs.mkdir(evidenceDir, { recursive: true }); const screenshot = path.join(evidenceDir, `${input.idempotencyKey}.png`); await page.screenshot({ path: screenshot, fullPage: true });
    return { status: config.mode === 'publish' ? 'published' : 'drafted', canonicalUrl: config.mode === 'publish' ? page.url() : undefined, evidence: screenshot };
  } finally { await browser.close(); }
}
