import { BookingData } from "@/app/api/payment_and_sms/route";
import prisma from "./db";

export async function getBookingsWithImages(searchId: string): Promise<BookingData[]> {
    try {
        // Adjust this query based on your actual database schema
        const searchResult = await prisma.searchResults.findUnique({
            where: { id: searchId },
            include: { results: true }
        });

        if (!searchResult || !searchResult.results) {
            return [];
        }

        // Extract bookings from each result and flatten into a single array
        const bookings = searchResult.results
            .map((result: any) => result.booking as BookingData)
            .filter((booking: BookingData) => booking && booking.images && booking.images.length > 0)
            .slice(0, 3);

        return bookings;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
}

export async function createSMSMessage(checkoutUrl: string, bookings: BookingData[]): Promise<string> {
    let message = `🏨 Hotel Booking Payment Link:\n${checkoutUrl}\n\n`;

    if (bookings.length > 0) {
        message += "Preview of available hotels:\n\n";

        bookings.forEach((booking, index) => {
            // message += `${index + 1}. ${booking.name}\n`;
            // message += `📍 ${booking.address.full}\n`;
            // message += `⭐ Rating: ${booking.rating}/10\n`;

            // Add first 2 image links
            if (booking.images && booking.images.length > 0) {
                const imageLinks = booking.images.slice(0, 3);
                message += ` Images ${index + 1}: ${imageLinks.join(', ')}\n`;
            }

            message += "\n";
        });
    }

    message += "Complete your payment to receive full listing details!";
    return message;
}

export function createBookingDetailsMessage(bookings: BookingData[]): string {
    let message = "✅ Payment Successful! Here are your booking options:\n\n";

    bookings.forEach((booking, index) => {
        message += ` ${index + 1}. ${booking.name}\n`;
        message += ` Booking Url: $${booking.url}\n`;
        message += `address ${booking.address.full}\n`;
        message += `Rating: ${booking.rating}\n`;

        if (booking.images && booking.images.length > 0) {
            message += `🖼️ Images: ${booking.images.join(', ')}\n`;
        }

        message += "\n";
    });

    message += "Thank you for your booking! 🎉";
    return message;
}
