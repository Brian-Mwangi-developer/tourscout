import { Page } from 'puppeteer';

export interface SetGuestsInput {
    page: Page;
    adults: number;
    children: number;
}

export class SetGuestsExecutor {
    static async execute(input: SetGuestsInput): Promise<void> {
        const { page, adults, children } = input;
        await page.evaluate((adults, children) => {
            // Set adults
            const adultsInput = document.querySelector('input#group_adults');
            if (adultsInput) {
                (adultsInput as HTMLInputElement).value = String(adults);
                (adultsInput as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
                (adultsInput as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));
            }
            // Set children
            const childrenInput = document.querySelector('input#group_children');
            if (childrenInput) {
                (childrenInput as HTMLInputElement).value = String(children);
                (childrenInput as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
                (childrenInput as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, adults, children);
    }
}