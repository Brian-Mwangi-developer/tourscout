// lib/workflow/executePlan.ts
import prisma from '@/lib/db';
import { WorkflowExecutor } from './ExecuteWorkflow';
import { ActivityType, SearchStatus, WorkflowExecutionStatus } from '@prisma/client';

export interface SearchRequest {
    query: string;
    location: string;
    startDate: Date;
    endDate: Date;
    noOfAdults: number;
    noOfChildren: number;
    type: ActivityType;
}

export class ExecutionPlan {

    static async createAndExecuteSearch(request: SearchRequest): Promise<string> {
        console.log('🎯 Creating new search execution plan');

        try {
            // 1. Save the activity to database
            const activity = await prisma.activity.create({
                data: {
                    query: request.query,
                    type: request.type,
                    location: request.location,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    noOfAdults: request.noOfAdults,
                    noOfChildren: request.noOfChildren,
                    dateFlexible: false
                }
            });

            console.log(`✅ Created activity: ${activity.id}`);

            // 2. Create workflow execution record
            const execution = await prisma.workflowExecution.create({
                data: {
                    status: WorkflowExecutionStatus.PENDING,
                    totalSteps: 0, // Will be updated during execution
                    stepsCompleted: 0,
                    currentStep: 'Initializing...'
                }
            });

            console.log(`✅ Created execution: ${execution.id}`);

            // 3. Execute the workflow asynchronously
            this.executeWorkflowAsync(execution.id, activity.id, request);

            return execution.id;

        } catch (error) {
            console.error('❌ Failed to create execution plan:', error);
            throw error;
        }
    }

    private static async executeWorkflowAsync(executionId: string, activityId: string, request: SearchRequest): Promise<void> {
        try {
            const executor = new WorkflowExecutor(executionId, activityId);

            await executor.executeBookingSearch({
                location: request.location,
                startDate: request.startDate,
                endDate: request.endDate,
                adults: request.noOfAdults,
                children: request.noOfChildren
            });

            // Update activity status
            await prisma.activity.update({
                where: { id: activityId },
                data: { updatedAt: new Date() }
            });

        } catch (error:any) {
            console.error('❌ Workflow execution failed:', error);

            // Update execution with error
            await prisma.workflowExecution.update({
                where: { id: executionId },
                data: {
                    status: WorkflowExecutionStatus.FAILED,
                    errorMessage: error.message,
                    completedAt: new Date()
                }
            });
        }
    }

    static async getExecutionStatus(executionId: string) {
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            select: {
                id: true,
                status: true,
                totalSteps: true,
                stepsCompleted: true,
                currentStep: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true
            }
        });

        if (!execution) {
            throw new Error('Execution not found');
        }

        return {
            id: execution.id,
            status: execution.status,
            progress: execution.totalSteps ? (execution.stepsCompleted / execution.totalSteps) * 100 : 0,
            currentStep: execution.currentStep,
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            errorMessage: execution.errorMessage
        };
    }

    static async getActivityResults(activityId: string) {
        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            include: {
                searches: {
                    where: {
                        status: SearchStatus.COMPLETED
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!activity) {
            throw new Error('Activity not found');
        }

        return {
            activity,
            results: activity.searches,
            totalResults: activity.searches.length
        };
    }
}