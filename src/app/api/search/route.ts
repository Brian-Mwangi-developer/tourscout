// app/api/search/route.ts
import { apifyClient } from '@/lib/apify-client';
import { processSearchQuery } from '@/lib/configure-AI';
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const searchRequest = await processSearchQuery(body.query);

        const pendingSearch = await prisma.searchResults.create({
            data:{
                prompt: body.query,
                status:"PENDING"
            }
        })

        console.log('🔍 db update, search Pending:');
        //Add webhook Url to the search Request
        const searchRequestWithWebhook ={
            ...searchRequest,
            // This will be sent to your webhook when complete
            webhookUrl: `${process.env.BASE_URL}/api/apify-webhook`,
            searchId: pendingSearch.id
        }
        console.log('🎬 Starting actor run...');
        const run = await apifyClient.actor(process.env.ACTOR_ID!).start(searchRequestWithWebhook);
        console.log('🚀 Actor run started:', run.id);

        await prisma.searchResults.update({
            where: { id: pendingSearch.id },
            data: {
                runId: run.id,
                status: 'RUNNING'
            }
        });
        return NextResponse.json({
            success: true,
            message: 'Search job started successfully',
            data: {
                searchId: pendingSearch.id,
                runId: run.id,
                status: 'RUNNING'
            }
        });


    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

