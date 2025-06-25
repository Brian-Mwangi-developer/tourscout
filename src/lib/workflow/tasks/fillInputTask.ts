import { TaskParamType, TaskType, WorkflowTask } from '@/types/tasks';
import { KeyboardIcon } from 'lucide-react';
import { Page } from 'puppeteer';


export const FillInputTask: WorkflowTask = {
    label: "Fill Input Field",
    icon: KeyboardIcon,
    type: TaskType.FILL_INPUT,
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
            helperText: "CSS selector for the input field",
            required: true,
        },
        {
            name: "value",
            type: TaskParamType.STRING,
            helperText: "Value to fill in the input",
            required: true,
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

export interface FillInputInput {
    page: Page;
    selector: string;
    value: string;
}

export interface FillInputOutput {
    page: Page;
}