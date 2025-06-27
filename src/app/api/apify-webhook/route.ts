import { apifyClient } from '@/lib/apify-client';
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
    console.log('📨 Webhook received from Apify');

    try {
        const webhookData = await request.json();
        console.log('📝 Webhook data:', webhookData);

        // Extract run info from webhook
        const { status, defaultDatasetId, searchId } = webhookData;
        console.log("Dataset ID:", defaultDatasetId);

        if (status !== 'SUCCEEDED') {
            console.error('❌ Actor run failed with status:', status);

            // Update database with failed status
            await prisma.searchResults.update({
                where: { id: searchId },
                data: { status: 'FAILED' }
            });

            return NextResponse.json({ success: false, error: 'Run failed' });
        }

        let items: any = [];

        // Get the dataset items
        if (defaultDatasetId) {
            console.log('📊 Retrieving dataset items...');
            const dataset = await apifyClient.dataset(defaultDatasetId).listItems();
            items = dataset.items;
            console.log('📊 Retrieved items count:', items.length);
        }

        // Update the search result in database
        console.log('💾 Updating database...');
        await prisma.searchResults.update({
            where: { id: searchId },
            data: {
                status: 'COMPLETED',
                results: {
                    create: items.map((item: any) => ({
                        booking: item,
                    })),
                },
            },
        });

        console.log('✅ Webhook processed successfully');

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ Webhook processing error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}