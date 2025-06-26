// lib/workflow/ExecuteWorkflow.ts
import prisma from '@/lib/db'; // Your global prisma instance
import { TaskType } from '@/types/tasks';
import { WorkflowExecutionStatus, SearchStatus } from '@prisma/client';
import { LaunchBrowserExecutor } from './executors/launchBrowserExecutor';
import { FillInputExecutor } from './executors/fillInputExecutor';
import { ClickElementExecutor } from './executors/clickElementExecutor';
import { LaunchBrowserInput } from './tasks/launchBrowserTask';
import { FillInputInput } from './tasks/fillInputTask';
import { ClickElementInput } from './tasks/clickElementTask';


export interface WorkflowStepBase<T extends TaskType, P> {
    id: string;
    type: T;
    name: string;
    params: P;
}

export type LaunchBrowserStep = WorkflowStepBase<TaskType.LAUNCH_BROWSER, LaunchBrowserInput>;
export type FillInputStep = WorkflowStepBase<TaskType.FILL_INPUT, Omit<FillInputInput, 'page'>>;
export type ClickElementStep = WorkflowStepBase<TaskType.CLICK_ELEMENT, Omit<ClickElementInput, 'page'>>;

export type WorkflowStep = LaunchBrowserStep | FillInputStep | ClickElementStep;

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
                        selector: 'button[data-testid="date-display-field-start"]'
                    }
                },
                {
                    id: 'select-checkin',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Select Check-in Date',
                    params: {
                        selector: this.getDateSelector(params.startDate)
                    }
                },
                {
                    id: 'select-checkout',
                    type: TaskType.CLICK_ELEMENT,
                    name: 'Select Check-out Date',
                    params: {
                        selector: this.getDateSelector(params.endDate)
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

        } catch (error:any) {
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

            default:
                throw new Error(`Unsupported task type: ${(step as any).type}`);
        }
    }

    private generateGuestSteps(adults: number, children: number): WorkflowStep[] {
        const steps: WorkflowStep[] = [];

        // Adults - click + button (adults - 1) times since default is 1
        for (let i = 1; i < adults; i++) {
            steps.push({
                id: `add-adult-${i}`,
                type: TaskType.CLICK_ELEMENT,
                name: `Add Adult ${i + 1}`,
                params: {
                    selector: 'button[data-testid="occupancy-popup-adults-increment"]'
                }
            });
        }

        // Children - click + button children times
        for (let i = 0; i < children; i++) {
            steps.push({
                id: `add-child-${i}`,
                type: TaskType.CLICK_ELEMENT,
                name: `Add Child ${i + 1}`,
                params: {
                    selector: 'button[data-testid="occupancy-popup-children-increment"]'
                }
            });
        }

        // Close the popup
        steps.push({
            id: 'close-guests-popup',
            type: TaskType.CLICK_ELEMENT,
            name: 'Close Guest Selector',
            params: {
                selector: 'button[data-testid="occupancy-popup-close"]'
            }
        });

        return steps;
    }

    private getDateSelector(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `span[data-date="${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}"]`;
    }

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