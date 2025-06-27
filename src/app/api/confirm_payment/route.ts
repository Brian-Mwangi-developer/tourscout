import prisma from "@/lib/db";
import { createBookingDetailsMessage, getBookingsWithImages } from "@/lib/getBookings";
import { stripe } from "@/lib/stripe";
import Africastalking from "africastalking";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const africastalking = Africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY!,
    username: process.env.AFRICASTALKING_USERNAME!,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    console.log("Received event:", event.type);

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Checkout session completed:", session.id);
        console.log("Payment status:", session.payment_status);
        console.log("Session metadata:", session.metadata);

        try {
            // Extract metadata
            const searchId = session.metadata?.searchId;
            const phoneNumber = session.metadata?.phoneNumber;

            if (!searchId) {
                console.error("No searchId found in session metadata");
                return NextResponse.json({ error: "Missing searchId in metadata" }, { status: 400 });
            }

            // Find the search result by session ID (more reliable than using metadata)
            const searchResult = await prisma.searchResults.findFirst({
                where: {
                    stripeSessionId: session.id
                },
                include: {
                    results: true
                }
            });

            if (!searchResult) {
                console.error("Search result not found for session:", session.id);
                return NextResponse.json({ error: "Search result not found" }, { status: 404 });
            }

            // Update payment status to PAID
            await prisma.searchResults.update({
                where: { id: searchResult.id },
                data: {
                    paymentStatus: "PAID"
                }
            });

            console.log("Payment status updated to PAID for search:", searchResult.id);

            // If payment is successful, send booking details via SMS
            if (session.payment_status === "paid") {
                const phoneToSend = searchResult.phoneNumber || phoneNumber;

                if (phoneToSend) {
                    // Get all bookings with images
                    const bookingsWithImages = await getBookingsWithImages(searchResult.id);

                    if (bookingsWithImages.length > 0) {
                        // Create detailed booking message
                        const bookingMessage = createBookingDetailsMessage(bookingsWithImages);

                        // Send SMS with booking details
                        try {
                            const smsResult = await africastalking.SMS.send({
                                from: 'AFTKNG',
                                to: phoneToSend,
                                message: bookingMessage,
                            });

                            console.log("Booking details SMS sent successfully:", smsResult);
                        } catch (smsError) {
                            console.error("Failed to send booking details SMS:", smsError);
                            // Don't fail the webhook if SMS fails
                        }
                    } else {
                        console.log("No bookings with images found for search:", searchResult.id);
                    }
                } else {
                    console.error("No phone number found for sending booking details");
                }
            }

            return NextResponse.json({ received: true });

        } catch (error) {
            console.error("Error processing checkout session:", error);
            return NextResponse.json(
                { error: "Error processing payment confirmation" },
                { status: 500 }
            );
        }
    }

    // Handle payment_intent.succeeded event (backup)
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);

        // You can add additional logic here if needed
        return NextResponse.json({ received: true });
    }

    // Handle other event types if needed
    console.log("Unhandled event type:", event.type);
    return NextResponse.json({ received: true });
}

// Optional: Add a GET method for testing webhook endpoint
export async function GET() {
    return NextResponse.json({
        message: "Webhook endpoint is active",
        timestamp: new Date().toISOString()
    });
}