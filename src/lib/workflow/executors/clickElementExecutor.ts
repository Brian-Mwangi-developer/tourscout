import { Page } from 'puppeteer';
import { ClickElementInput, ClickElementOutput } from '../tasks/clickElementTask';

export class ClickElementExecutor {
    static async execute(input: ClickElementInput): Promise<ClickElementOutput> {
        const page = input.page as Page;

        // Handle date-based click
        if (input.date) {
            const year = input.date.getFullYear();
            const monthName = input.date.toLocaleString('default', { month: 'long' });
            const day = input.date.getDate().toString().padStart(2, '0');
            const month = (input.date.getMonth() + 1).toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            await page.evaluate((monthName: string, year: number, dateStr: string) => {
                const monthDivs = Array.from(document.querySelectorAll('div.d7b9e080b'));
                for (const div of monthDivs) {
                    const header = div.querySelector('h3');
                    if (header && header.textContent?.includes(`${monthName} ${year}`)) {
                        const dateCell = div.querySelector(`td[data-date="${dateStr}"]`);
                        if (dateCell) {
                            (dateCell as HTMLElement).click();
                            break;
                        }
                    }
                }
            }, monthName, year, dateStr);

            return { page };
        }

        // Handle selector-based click
        if (input.selector) {
            console.log(`🖱️  Clicking element: ${input.selector}`);

            await page.waitForSelector(input.selector, {
                visible: true,
                timeout: 15000
            });

            await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, input.selector);

            if (input.waitForNavigation) {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                    page.click(input.selector)
                ]);
            } else {
                await page.click(input.selector);
            }

            return { page };
        }

        throw new Error('ClickElementExecutor: Either selector or date must be provided.');
    }
}