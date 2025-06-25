import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RunsFilterProps {
    activeFilter: 'all' | 'successful' | 'failed' | 'running';
    onFilterChange: (filter: 'all' | 'successful' | 'failed' | 'running') => void;
    counts: {
        all: number;
        successful: number;
        failed: number;
        running: number;
    };
}

export const RunsFilter = ({ activeFilter, onFilterChange, counts }: RunsFilterProps) => {
    const filters = [
        { key: 'all' as const, label: 'All Runs', count: counts.all },
        { key: 'successful' as const, label: 'Successful', count: counts.successful },
        { key: 'failed' as const, label: 'Failed', count: counts.failed },
        { key: 'running' as const, label: 'Running', count: counts.running },
    ];

    return (
        <div className="border-b bg-gray-50 px-6 h-24  mt-0 w-full">
            <div className="flex gap-2  py-4">
                {filters.map((filter) => (
                    <Button
                        key={filter.key}
                        variant={activeFilter === filter.key ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onFilterChange(filter.key)}
                        className="flex items-center gap-2"
                    >
                        {filter.label}
                        <Badge variant="secondary" className="ml-1">
                            {filter.count}
                        </Badge>
                    </Button>
                ))}
            </div>
        </div>
    );
};