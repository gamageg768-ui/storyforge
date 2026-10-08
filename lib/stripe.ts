import Stripe from 'stripe'

export const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

let _stripe: Stripe | null = null

function getInstance(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
    })
  }
  return _stripe
}

// Proxy so callers can use `stripe.checkout.sessions.create(...)` unchanged,
// but the Stripe constructor only runs at request time (not module load time).
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getInstance(), prop, receiver)
  },
})
