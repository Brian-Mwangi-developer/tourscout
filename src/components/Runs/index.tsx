import { mockRuns } from "@/lib/data";
import { useState } from "react";
import { RunCard, WorkflowRun } from "./runcard";
import { RunsFilter } from "./runs-filter";





export const AgentRuns = () => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'successful' | 'failed' | 'running'>('all');
    const [runs, setRuns] = useState<WorkflowRun[]>(mockRuns);

    const filteredRuns = runs.filter(run => {
        switch (activeFilter) {
            case 'successful':
                return run.status === 'COMPLETED';
            case 'failed':
                return run.status === 'FAILED';
            case 'running':
                return run.status === 'RUNNING';
            default:
                return true;
        }
    });

    const counts = {
        all: runs.length,
        successful: runs.filter(r => r.status === 'COMPLETED').length,
        failed: runs.filter(r => r.status === 'FAILED').length,
        running: runs.filter(r => r.status === 'RUNNING').length,
    };

    return (
        <div className="mt-0">
            <RunsFilter
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={counts}
            />
            <div>
                {filteredRuns.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-2xl mb-2">No runs found</div>
                        <div className="text-gray-500 text-md">
                            {activeFilter === 'all'
                                ? 'No workflow runs have been executed yet.'
                                : `No ${activeFilter} runs found.`}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 max-w-4xl mx-auto my-6">
                        {filteredRuns.map((run) => (
                            <RunCard key={run.id} run={run} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}