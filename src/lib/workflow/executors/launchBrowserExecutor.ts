

import puppeteer from 'puppeteer';
import { LaunchBrowserInput, LaunchBrowserOutput } from '../tasks/launchBrowserTask';

// const BROWSER_WS=""

export class LaunchBrowserExecutor {
    static async execute(input: LaunchBrowserInput): Promise<LaunchBrowserOutput> {
        console.log(`🚀 Launching browser and navigating to: ${input.websiteUrl}`);

        try {
            const browser = await puppeteer.launch({
                headless: false, // Set to true for production
                defaultViewport: null,
                args: [
                    '--start-maximized',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            const page = await browser.newPage();

            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // Navigate to the URL
            await page.goto(input.websiteUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Wait a bit for the page to fully load
            await page.waitForSelector('body', { timeout: 10000 });

            console.log('✅ Browser launched successfully');

            return {
                browser,
                page
            };
        } catch (error) {
            console.error('❌ Failed to launch browser:', error);
            throw new Error(`Failed to launch browser: ${error}`);
        }
    }
}