// // api/search-status/route.ts - Check search status
// import prisma from '@/lib/db';
// import { NextRequest, NextResponse } from 'next/server';



// let searchId: string | undefined;

// export async function GET(request: NextRequest) {
//     try {
//         if (!searchId) {
//             return NextResponse.json({
//                 success: false,
//                 error: 'Search ID is required'
//             }, { status: 400 });
//         }
//         console.log('🔍 Checking status for search ID:', searchId);
//         const searchResult = await prisma.searchResults.findUnique({
//             where: { id: searchId },
//             include: { results: true }
//         });
//         if (!searchResult) {
//             return NextResponse.json({
//                 success: false,
//                 error: 'Search not found'
//             }, { status: 404 });
//         }

//         if (!searchResult.results || searchResult.results.length === 0) {
//             return NextResponse.json({
//                 success: true,
//                 message: `The Search "${searchResult.prompt}" is still in progress. Please check back later.`
//             }, { status: 200 });
//         }

//         return NextResponse.json({
//             success: true,
//             data: {
//                 id: searchResult.id,
//                 status: searchResult.status,
//                 prompt: searchResult.prompt,
//                 resultsCount: searchResult.results?.length,
//                 results: searchResult.results
//             }
//         });

//     } catch (error: any) {
//         console.error('❌ Status check error:', error);
//         return NextResponse.json({
//             success: false,
//             error: error.message
//         }, { status: 500 });
//     }
// }

// export async function POST(request: NextRequest) {
//     try {
//         const body = await request.json();
//         searchId = body.searchId;

//         if (!searchId) {
//             return NextResponse.json({
//                 success: false,
//                 error: 'Search ID is required'
//             }, { status: 400 });
//         }

//         console.log('🔍 Checking status for search ID:', searchId);


//         return NextResponse.json({ success: true });

//     } catch (error: any) {
//         console.error('❌ Status check error:', error);
//         return NextResponse.json({
//             success: false,
//             error: error.message
//         }, { status: 500 });
//     }
// }