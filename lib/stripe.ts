import Stripe from 'stripe'

export const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-06-24.dahlia',
})
