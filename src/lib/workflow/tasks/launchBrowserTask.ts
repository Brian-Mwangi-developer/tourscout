import {Browser,Page} from 'puppeteer';
import { GlobeIcon } from 'lucide-react';
import { TaskParamType, TaskType, WorkflowTask } from '@/types/tasks';


export const LaunchBrowserTask:WorkflowTask ={
    label: "Launch Browser",
    icon: GlobeIcon,
    type: TaskType.LAUNCH_BROWSER,
    isEntryPoint: true,
    inputs: [
        {
            name: "websiteUrl",
            type: TaskParamType.STRING,
            helperText: "URL to navigate to",
            required: true,
        }
      ],
    outputs: [
        {
            name: "browser",
            type: TaskParamType.BROWSER_INSTANCE,
            required: true,
        },
        {
            name: "page",
            type: TaskParamType.BROWSER_INSTANCE,
            required: true,
        }
    ],
    credits: 5

};

export interface LaunchBrowserInput {
    websiteUrl: string;
}

export interface LaunchBrowserOutput {
    browser: Browser;
    page: Page;
  }
  
