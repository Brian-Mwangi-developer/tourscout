// lib/workflow/ExecuteWorkflow.ts
import prisma from '@/lib/db'; // Your global prisma instance
import { TaskType } from '@/types/tasks';
import { SearchStatus, WorkflowExecutionStatus } from '@prisma/client';
import { ClickElementExecutor } from './executors/clickElementExecutor';
import { FillInputExecutor } from './executors/fillInputExecutor';
import { LaunchBrowserExecutor } from './executors/launchBrowserExecutor';
import { SetGuestsExecutor } from './executors/setGuestExecutor';
import { ClickElementInput } from './tasks/clickElementTask';
import { FillInputInput } from './tasks/fillInputTask';
import { LaunchBrowserInput } from './tasks/launchBrowserTask';


export interface WorkflowStepBase<T extends TaskType, P> {
    id: string;
    type: T;
    name: string;
    params: P;
}

export type LaunchBrowserStep = WorkflowStepBase<TaskType.LAUNCH_BROWSER, LaunchBrowserInput>;
export type FillInputStep = WorkflowStepBase<TaskType.FILL_INPUT, Omit<FillInputInput, 'page'>>;
export type ClickElementStep = WorkflowStepBase<TaskType.CLICK_ELEMENT, Omit<ClickElementInput, 'page'>>;
export type SetGuestsStep = WorkflowStepBase<TaskType.SET_GUESTS, { adults: number; children: number }>;

export type WorkflowStep = LaunchBrowserStep | FillInputStep | ClickElementStep | SetGuestsStep;

export interface BookingSearchParams {
    location: string;
    startDate: Date;
    endDate: Date;
    adults: number;
    children: number;
}

//Takes the activity and execution flow via id and calls the Executors for each step
export class WorkflowExecutor {
    private executionId: string;
    private activityId: string;
    private context: Map<string, any> = new Map();

    constructor(executionId: string, activityId: string) {
        this.executionId = executionId;
        this.activityId = activityId;
    }

    async executeBookingSearch(params: BookingSearchParams): Promise<void> {
        console.log('🎯 Starting Booking.com search workflow');

        try {
            // Update execution status
            await this.updateExecutionStatus(WorkflowExecutionStatus.RUNNING);

            // Define the workflow steps for Booking.com
            const steps: WorkflowStep[] = [
                {
                    id: 'launch-browser',
                    type: TaskType.LAUNCH_BROWSER,
                    name: 'Launch Browser',
                    params: {
                        websiteUrl: 'https://www.booking.com'
                    }
                },
                {
                    id: 'fill-location',
                    type: TaskType.FILL_INPUT,
                    name: 'Fill Location',
                    params: {
                        selector: 'input[name="ss"]',
                        value: params.location
                    }
                },
                {
                    id: 'click-dates',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Open Date Picker',
                    params: {
                        selector: 'button[data-testid="searchbox-dates-container"]',
                    }
                },
                {
                    id: 'select-checkin',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Select Check-in Date',
                    params: {
                        date: params.startDate
                    }
                },
                {
                    id: 'select-checkout',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Select Check-out Date',
                    params: {
                        date: params.endDate
                    }
                },
                {
                    id: 'click-guests',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Open Guest Selector',
                    params: {
                        selector: 'button[data-testid="occupancy-config"]'
                    }
                },
                // Add steps for setting adults/children counts
                ...this.generateGuestSteps(params.adults, params.children),
                {
                    id: 'search',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Click Search',
                    params: {
                        selector: 'button[type="submit"]',
                        waitForNavigation: true
                    }
                }
            ];

            // Execute each step
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                console.log(`📋 Executing step ${i + 1}/${steps.length}: ${step.name}`);

                await this.updateExecutionProgress(i + 1, steps.length, step.name);
                await this.executeStep(step);

                // Add delay between steps
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // After search results load, extract and save data
            await this.extractAndSaveResults();

            await this.updateExecutionStatus(WorkflowExecutionStatus.COMPLETED);
            console.log('✅ Workflow completed successfully');

        } catch (error: any) {
            console.error('❌ Workflow execution failed:', error);
            await this.updateExecutionStatus(WorkflowExecutionStatus.FAILED, error.message);
            throw error;
        } finally {
            // Cleanup browser
            const browser = this.context.get('browser');
            if (browser) {
                await browser.close();
            }
        }
    }

    private async executeStep(step: WorkflowStep): Promise<void> {
        switch (step.type) {
            case TaskType.LAUNCH_BROWSER:
                const browserResult = await LaunchBrowserExecutor.execute(step.params);
                this.context.set('browser', browserResult.browser);
                this.context.set('page', browserResult.page);
                break;

            case TaskType.FILL_INPUT:
                if (!this.context.has('page')) {
                    throw new Error('Page not found in context for FillInput step');
                }
                await FillInputExecutor.execute({
                    ...step.params,
                    page: this.context.get('page')
                });
                break;

            case TaskType.CLICK_ELEMENT:
                if (!this.context.has('page')) {
                    throw new Error('Page not found in context for ClickElement step');
                }
                await ClickElementExecutor.execute({
                    ...step.params,
                    page: this.context.get('page')
                });
                break;
            case TaskType.SET_GUESTS:
                if (!this.context.has('page')) {
                    throw new Error('Page not found in context for SetGuests step');
                }
                await SetGuestsExecutor.execute({
                    ...step.params,
                    page: this.context.get('page')
                });
                break;

            default:
                throw new Error(`Unsupported task type: ${(step as any).type}`);
        }
    }

    private generateGuestSteps(adults: number, children: number): WorkflowStep[] {
        // const steps: WorkflowStep[] = [];

        return [
            {
                id: 'set-guests',
                type: TaskType.SET_GUESTS,
                name: 'Set Guests',
                params: { adults, children }
            },
            {
                id: 'close-guests-popup',
                type: TaskType.CLICK_ELEMENT,
                name: 'Close Guest Selector',
                params: {
                    selector: 'button[data-testid="occupancy-popup-close"]'
                }
            }
        ];
    }

    // private getDateSelector(date: Date): string {
    //     const year = date.getFullYear();
    //     const month = date.getMonth() + 1;
    //     const day = date.getDate();
    //     return `td[data-date="${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}"]`;
    // }
    // private async clickDateInCalendar(page: any, date: Date): Promise<void> {
    //     const year = date.getFullYear();
    //     const monthName = date.toLocaleString('default', { month: 'long' }); // e.g., "July"
    //     const day = date.getDate().toString().padStart(2, '0');
    //     const month = (date.getMonth() + 1).toString().padStart(2, '0');
    //     const dateStr = `${year}-${month}-${day}`;

    //     await page.evaluate((monthName: string, year: string, dateStr: string) => {
    //         // Find all month containers
    //         const monthDivs = Array.from(document.querySelectorAll('div.d7b9e080b'));
    //         for (const div of monthDivs) {
    //             const header = div.querySelector('h3');
    //             if (header && header.textContent?.includes(`${monthName} ${year}`)) {
    //                 const dateTd = div.querySelector(`td[data-date="${dateStr}"]`);
    //                 if (dateTd) {
    //                     // Click the span inside the td
    //                     const span = dateTd.querySelector('span');
    //                     if (span) {
    //                         (span as HTMLElement).click();
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //     }, monthName, year, dateStr);
    // }

    private async extractAndSaveResults(): Promise<void> {
        const page = this.context.get('page');
        if (!page) return;

        // Wait for results to load
        await page.waitForSelector('[data-testid="property-card"]', { timeout: 30000 });

        // Extract property data
        const properties = await page.evaluate(() => {
            const propertyCards = document.querySelectorAll('[data-testid="property-card"]');
            const results = [];

            for (let i = 0; i < Math.min(propertyCards.length, 10); i++) {
                const card = propertyCards[i];

                try {
                    const nameElement = card.querySelector('[data-testid="title"]');
                    const priceElement = card.querySelector('[data-testid="price-and-discounted-price"]');
                    const ratingElement = card.querySelector('[data-testid="review-score"]');
                    const linkElement = card.querySelector('a[data-testid="title-link"]');

                    results.push({
                        name: nameElement?.textContent?.trim() || '',
                        price: priceElement?.textContent?.trim() || '',
                        rating: ratingElement?.textContent?.trim() || '',
                        url: (linkElement as HTMLAnchorElement | null)?.href || ''
                    });
                } catch (error) {
                    console.warn('Error extracting property data:', error);
                }
            }

            return results;
        });

        // Save to database
        for (const property of properties) {
            await prisma.search.create({
                data: {
                    activityId: this.activityId,
                    sourceUrl: page.url(),
                    websiteName: 'Booking.com',
                    propertyName: property.name,
                    price: this.extractPrice(property.price),
                    rating: this.extractRating(property.rating),
                    bookingUrl: property.url,
                    status: SearchStatus.COMPLETED
                }
            });
        }

        console.log(`💾 Saved ${properties.length} properties to database`);
    }

    private extractPrice(priceText: string): number | null {
        const match = priceText.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(',', '')) : null;
    }

    private extractRating(ratingText: string): number | null {
        const match = ratingText.match(/\d+\.?\d*/);
        return match ? parseFloat(match[0]) : null;
    }

    private async updateExecutionStatus(status: WorkflowExecutionStatus, errorMessage?: string): Promise<void> {
        await prisma.workflowExecution.update({
            where: { id: this.executionId },
            data: {
                status,
                errorMessage,
                completedAt: status === WorkflowExecutionStatus.COMPLETED ? new Date() : undefined
            }
        });
    }

    private async updateExecutionProgress(completed: number, total: number, currentStep: string): Promise<void> {
        await prisma.workflowExecution.update({
            where: { id: this.executionId },
            data: {
                stepsCompleted: completed,
                totalSteps: total,
                currentStep
            }
        });
    }
}