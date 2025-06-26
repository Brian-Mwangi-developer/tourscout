import { Page } from 'puppeteer';
import { FillInputInput, FillInputOutput } from '../tasks/fillInputTask';

export class FillInputExecutor {
    static async execute(input: FillInputInput): Promise<FillInputOutput> {
        console.log(`⌨️  Filling input field: ${input.selector} with value: ${input.value}`);

        try {
            const page = input.page as Page;

            // Wait for the element to be available
            await page.waitForSelector(input.selector, { timeout: 10000 });

            // Clear the field first
            await page.click(input.selector, { clickCount: 3 });
            await page.keyboard.press('Backspace');

            // Type the new value
            await page.type(input.selector, input.value, { delay: 100 });

            // // Wait a moment for the input to register
            // await page.waitForTimeout(500);

            console.log('✅ Input filled successfully');

            return {
                page
            };
        } catch (error) {
            console.error('❌ Failed to fill input:', error);
            throw new Error(`Failed to fill input field ${input.selector}: ${error}`);
        }
    }
}