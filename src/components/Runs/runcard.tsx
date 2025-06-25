import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, MapPin, Users, XCircle } from "lucide-react";
export interface WorkflowRun {
    id: string;
    status: 'COMPLETED' | 'FAILED' | 'RUNNING';
    userQuery: string;
    queryType: 'accommodation' | 'transport' | 'activity' | 'restaurant';
    location: string;
    guestCount?: number;
    credits: number;
    startedAt: string;
    completedAt?: string;
    results?: number;
    error?: string;
}

interface RunCardProps {
    run: WorkflowRun;
}

export const RunCard = ({ run }: RunCardProps) => {
    const getStatusIcon = () => {
        switch (run.status) {
            case 'COMPLETED':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'FAILED':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'RUNNING':
                return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
        }
    };

    const getStatusBadge = () => {
        switch (run.status) {
            case 'COMPLETED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
            case 'FAILED':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
            case 'RUNNING':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>;
        }
    };

    const getQueryTypeIcon = () => {
        switch (run.queryType) {
            case 'accommodation':
                return '🏠';
            case 'transport':
                return '✈️';
            case 'activity':
                return '🎯';
            case 'restaurant':
                return '🍽️';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minutes ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} days ago`;
        }
    };

    return (
        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                        <span className="text-xl">{getQueryTypeIcon()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon()}
                            {getStatusBadge()}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                            {run.userQuery}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{run.location}</span>
                            </div>
                            {run.guestCount && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{run.guestCount} guests</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatTimeAgo(run.startedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{run.credits}</div>
                    <div className="text-xs text-gray-500">Credits</div>
                </div>
            </div>

            {run.status === 'COMPLETED' && run.results && (
                <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                        ✅ Found {run.results} results for the user
                    </p>
                </div>
            )}

            {run.status === 'FAILED' && run.error && (
                <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                        ❌ {run.error}
                    </p>
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Run ID: {run.id}</span>
                    {run.completedAt && (
                        <span>Completed: {formatTimeAgo(run.completedAt)}</span>
                    )}
                </div>
            </div>
        </Card>
    );
};