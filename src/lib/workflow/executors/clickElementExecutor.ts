import { Page } from 'puppeteer';
import { ClickElementInput, ClickElementOutput } from '../tasks/clickElementTask';

export class ClickElementExecutor {
    static async execute(input: ClickElementInput): Promise<ClickElementOutput> {
        const page = input.page as Page;

        // Handle date-based click
        if (input.date) {
            const year = input.date.getFullYear();
            const monthName = input.date.toLocaleString('default', { month: 'long' });
            const day = input.date.getDate();
            const month = input.date.getMonth() + 1;
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            console.log(`📅 Clicking date: ${dateStr} (${monthName} ${day}, ${year})`);

            // Wait for the calendar to be visible
            await page.waitForSelector('table[role="grid"]', {
                visible: true,
                timeout: 10000
            });

            const clicked = await page.evaluate((monthName: string, year: number, day: number, dateStr: string) => {
                // Find the correct month grid
                const monthGrids = Array.from(document.querySelectorAll('table[role="grid"]'));

                for (const grid of monthGrids) {
                    // Look for the month header - it might be in a parent container
                    const monthContainer = grid.closest('div');
                    if (!monthContainer) continue;

                    // Check for month header in various possible locations
                    const monthHeader = monthContainer.querySelector('h3') ||
                        monthContainer.parentElement?.querySelector('h3') ||
                        monthContainer.previousElementSibling?.querySelector('h3');

                    if (monthHeader && monthHeader.textContent?.includes(`${monthName} ${year}`)) {
                        // Find the date button within this grid
                        const dateButtons = grid.querySelectorAll('button[aria-pressed]');

                        for (const button of dateButtons) {
                            // Check if this button represents our target date
                            const buttonText = button.textContent?.trim();
                            const buttonDay = parseInt(buttonText || '0');

                            // Additional check: look for data-date attribute or aria-label
                            const ariaLabel = button.getAttribute('aria-label');
                            const dataDate = button.getAttribute('data-date') ||
                                button.closest('td')?.getAttribute('data-date');

                            // Match by day number and verify it's in the right month context
                            if (buttonDay === day &&
                                (dataDate === dateStr ||
                                    ariaLabel?.includes(`${day}`) ||
                                    button.textContent?.trim() === day.toString())) {

                                console.log(`Found date button for ${day}:`, button);
                                (button as HTMLElement).click();
                                return true;
                            }
                        }
                    }
                }

                // Fallback: try to find by data-date attribute directly
                const fallbackButton = document.querySelector(`button[data-date="${dateStr}"]`) ||
                    document.querySelector(`td[data-date="${dateStr}"] button`) ||
                    document.querySelector(`button[aria-label*="${monthName} ${day}"]`);

                if (fallbackButton) {
                    console.log('Using fallback date selection:', fallbackButton);
                    (fallbackButton as HTMLElement).click();
                    return true;
                }

                return false;
            }, monthName, year, day, dateStr);

            if (!clicked) {
                throw new Error(`Failed to click date: ${dateStr}. Date element not found in calendar.`);
            }

            // Small delay to allow the calendar to update
            await new Promise(resolve => setTimeout(resolve, 500));

            return { page };
        }

        // Handle selector-based click
        if (input.selector) {
            console.log(`🖱️  Clicking element: ${input.selector}`);

            await page.waitForSelector(input.selector, {
                visible: true,
                timeout: 15000
            });

            // Scroll element into view
            await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, input.selector);

            // Small delay after scrolling
            await new Promise(resolve => setTimeout(resolve, 300));

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