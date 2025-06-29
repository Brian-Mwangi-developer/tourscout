"use client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    content: ReactNode;
    side?: "top" | "right" | "bottom" | "left"

}
const TooltipWrapper = (props: Props) => {
    if (!props.content) return props.children;
    return <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>{props.children}</TooltipTrigger>
            <TooltipContent side={props.side}>{props.content}</TooltipContent>
        </Tooltip>
    </TooltipProvider>
}
export default TooltipWrapper
