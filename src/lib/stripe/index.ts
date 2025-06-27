import Stripe from "stripe";

export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY ?? '', {
    apiVersion: "2025-02-24.acacia",
    appInfo: {
        name: "Webinar Saas",
        version: "0.1.0",
    }
})