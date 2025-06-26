import { TaskParamType, TaskType, WorkflowTask } from '@/types/tasks';
import { MousePointerClickIcon } from 'lucide-react';
import { Page } from 'puppeteer';

export const ClickElementTask: WorkflowTask = {
    label: "Click Element",
    icon: MousePointerClickIcon,
    type: TaskType.CLICK_ELEMENT,
    inputs: [
        {
            name: "page",
            type: TaskParamType.BROWSER_INSTANCE,
            required: true,
            hideHandle: true,
        },
        {
            name: "selector",
            type: TaskParamType.STRING,
            helperText: "CSS selector for the element to click",
            required: true,
        },
        {
            name: "waitForNavigation",
            type: TaskParamType.SELECT,
            helperText: "Wait for page navigation after click",
            required: false,
            options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" }
            ],
            defaultValue: "false"
        }
    ],
    outputs: [
        {
            name: "page",
            type: TaskParamType.BROWSER_INSTANCE,
            required: true,
        }
    ],
    credits: 1
};

export interface ClickElementInput {
    page: Page;
    selector: string;
    waitForNavigation?: boolean;
}

export interface ClickElementOutput {
    page: Page;
}