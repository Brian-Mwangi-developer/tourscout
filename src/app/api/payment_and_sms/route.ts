import prisma from "@/lib/db";
import { createSMSMessage, getBookingsWithImages } from "@/lib/getBookings";
import { stripe } from "@/lib/stripe";
import Africastalking from "africastalking";
import { NextRequest, NextResponse } from "next/server";


let globalSearchId: string | null = null;

const africastalking = Africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY!,
    username: process.env.AFRICASTALKING_USERNAME!,
});

export interface BookingData {
    [key: string]: any;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (body.searchId && !body.phoneNumber) {
            globalSearchId = body.searchId;
            return NextResponse.json({
                success: true,
                message: "Search ID updated successfully",
                searchId: globalSearchId
            });
        }

        if (body.phoneNumber && body.searchId) {
            const { phoneNumber, searchId } = body;
            console.log("Received phone number:", phoneNumber);
            console.log("Received search ID:", searchId);

            const searchResult = await prisma.searchResults.findUnique({
                where: { id: searchId },
                include: {
                    results: true
                }
            });

            if (!searchResult) {
                return NextResponse.json({
                    success: false,
                    error: "Search result not found"
                }, { status: 404 });
            }
            const priceId = process.env.STRIPE_PRICE_ID!;
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'payment', // Changed from subscription to payment
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
                metadata: {
                    searchId: globalSearchId,
                    phoneNumber: phoneNumber,
                },
            });

            const bookingsWithImages = await getBookingsWithImages(searchId!);
            const smsMessage = await createSMSMessage(session.url!, bookingsWithImages);
            const smsResult = await africastalking.SMS.send({
                from: 'AFTKNG',
                to: phoneNumber,
                message: smsMessage,
            });
            if (smsResult.Recipients) {
                return NextResponse.json({
                    success: true,
                    message: "Checkout link sent via SMS successfully",
                    sessionUrl: session.url,
                    sessionId: session.id
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: "Failed to send SMS",
                    details: smsResult
                }, { status: 500 });
            }
        }
        return NextResponse.json({
            success: false,
            error: "Invalid request. Please provide a searchId or phoneNumber."
        }, { status: 400 });
    } catch (error: any) {
        console.error("Error in payment and SMS API:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
