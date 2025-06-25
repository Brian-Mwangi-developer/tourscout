"use client";

import TooltipWrapper from "@/components/TooltipWrapper";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
// import SaveBtn from "@/app/workflow/_components/topbar/SaveBtn";
// import ExecuteBtn from "@/app/workflow/_components/topbar/ExecuteBtn";
// // import NavigationsTabs from "@/app/workflow/_components/topbar/NavigationsTabs";
// import PublishBtn from "@/app/workflow/_components/topbar/PublishBtn";
// import UnpublishBtn from "@/app/workflow/_components/topbar/UnpublishBtn";

interface Props {
    title: string;
    subtitle?: string
    hideButtons?: boolean
    isPublished?: boolean
}

function TopBar({ title, subtitle, hideButtons = false, isPublished = false }: Props) {
    const router = useRouter();
    return (
        <header className="flex p-2 border-b-2 border-separate
    justify-betwen w-full h-[60px] sticky top-0 bg-background z-10">
            <div className="flex gap- flex-1">
                <TooltipWrapper content="Back">
                    <Button variant={"ghost"} size={"icon"}
                        onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                    </Button>
                </TooltipWrapper>
                <div>
                    <p className="font-bold text-ellipsis truncate">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground truncate text-ellipsis">{subtitle}</p>
                    )}
                </div>
            </div>
            {/* <NavigationsTabs workflowId={workflowId} /> */}
            <div className="flex gap-1 flex-1 justify-end">
                {!hideButtons && (
                    <>
                        {/* <ExecuteBtn workflowId={workflowId} /> */}
                        <div></div>
                        {isPublished && (
                            // <UnpublishBtn workflowId={workflowId} />
                            <div></div>
                        )}
                        {!isPublished && (
                            <>
                                {/* <SaveBtn workflowId={workflowId} />
                                <PublishBtn workflowId={workflowId} /> */}
                                <div></div>
                            </>
                        )}
                    </>
                )}
            </div>
        </header>
    )
}

export default TopBar
