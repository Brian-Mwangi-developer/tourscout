"use server"

import prisma from "@/lib/db"
import { stripe } from "@/lib/stripe"
import Stripe from "stripe"



const subscriptionPriceId = `price_1RVYAYGMjfBDhdiDZf0qefEd`

export const onGetStripeClientSecret = async (email: string, userId: string) => {
    try {
        let customer: Stripe.Customer
        const existingCustomer = await stripe.customers.list({ email: email })
        if (existingCustomer.data.length > 0) {
            customer = existingCustomer.data[0]
        } else {
            // create a new customer if one does not exist
            customer = await stripe.customers.create({
                email: email,
                metadata: {
                    userId: userId
                }
            });
        }
        await prisma.searchResults.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id }
        })
        console.log("Price ID:", subscriptionPriceId);
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: subscriptionPriceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: userId
            },
        })
        console.log("Subscription created:", subscription.id);
        const paymentIntent = (subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent;
        return {
            status: 200,
            secret: paymentIntent.client_secret,
            customerId: customer.id
        }

    } catch (error) {
        console.error("Subscription Creation Error:", error);
        return {
            message: "Failed to create Subscription",
            status: 400,
        }
    }
}






export const createCheckoutLink = async (
    priceId: string,
    stripeId: string,
    searchId: string
) => {
    try {
        const session = await stripe.checkout.sessions.create(
            {
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
                metadata: {
                    searchId: searchId,
                },
            },
            {
                stripeAccount: stripeId
            }
        )
        return {
            sessionUrl: session.url,
            status: 200,
            success: true
        }
    } catch (error) {
        console.log("Error creating checkout link:", error);
        return {
            error: 'Error creating checkout link',
            status: 500,
            success: false
        }
    }
}