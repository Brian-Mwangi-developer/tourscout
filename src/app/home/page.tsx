"use client";
import { AgentRuns } from "@/components/Runs";
import TopBar from "@/components/topbar";
import { Loader2Icon } from "lucide-react";
import { Suspense } from "react";

const AgentsRuns = () => {
    return (
        <div className="h-full w-full overflow-auto">
            <TopBar title="All Agent's Booking Runs" hideButtons subtitle="Monitor travel assistant workflow executions" />
            <Suspense fallback={
                <div className="flex h-full items-center justify-center">
                    <Loader2Icon size={30} className="animate-spin stroke-primary" />
                </div>
            }>
                <AgentRuns />
            </Suspense>

        </div>
    )
}

export default AgentsRuns