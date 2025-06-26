// lib/workflow/executors/ClickElementExecutor.ts
import { Page } from 'puppeteer';
import { ClickElementInput, ClickElementOutput } from '../tasks/clickElementTask';

export class ClickElementExecutor {
    static async execute(input: ClickElementInput): Promise<ClickElementOutput> {
        console.log(`🖱️  Clicking element: ${input.selector}`);

        try {
            const page = input.page as Page;

            // Wait for the element to be available and visible
            await page.waitForSelector(input.selector, {
                visible: true,
                timeout: 15000
            });

            // Scroll to element to ensure it's in view
            await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, input.selector);

            // Wait a moment after scrolling
            // await page.waitForTimeout(500);

            // Click the element
            if (input.waitForNavigation) {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                    page.click(input.selector)
                ]);
            } else {
                await page.click(input.selector);
            }

            // Wait a moment after clicking
            // await page.waitForTimeout(1000);

            console.log('✅ Element clicked successfully');

            return {
                page
            };
        } catch (error) {
            console.error('❌ Failed to click element:', error);
            throw new Error(`Failed to click element ${input.selector}: ${error}`);
        }
    }
}