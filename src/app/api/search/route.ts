// app/api/search/route.ts
import { ExecutionPlan } from '@/lib/workflow/ExecutePlan';
import { ActivityType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const searchRequest = {
            query: body.query,
            location: body.location,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            noOfAdults: body.noOfAdults || 1,
            noOfChildren: body.noOfChildren || 0,
            type: ActivityType.ACCOMMODATION
        };

        const executionId = await ExecutionPlan.createAndExecuteSearch(searchRequest);

        return NextResponse.json({
            success: true,
            executionId,
            message: 'Search started successfully'
        });

    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const executionId = searchParams.get('executionId');
        const activityId = searchParams.get('activityId');

        if (executionId) {
            const status = await ExecutionPlan.getExecutionStatus(executionId);
            return NextResponse.json({ success: true, data: status });
        }

        if (activityId) {
            const results = await ExecutionPlan.getActivityResults(activityId);
            return NextResponse.json({ success: true, data: results });
        }

        return NextResponse.json(
            { success: false, error: 'Missing executionId or activityId' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Get status API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}