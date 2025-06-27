// api/search-status/[id]/route.ts - Check search status
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const searchResult = await prisma.searchResults.findUnique({
            where: { id: params.id },
            include: { results: true }
        });

        if (!searchResult) {
            return NextResponse.json({
                success: false,
                error: 'Search not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: searchResult.id,
                status: searchResult.status,
                prompt: searchResult.prompt,
                resultsCount: searchResult.results?.length || 0,
                results: searchResult.status === 'COMPLETED' ? searchResult.results : null
            }
        });

    } catch (error: any) {
        console.error('❌ Status check error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}