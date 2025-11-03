import express from 'express';
import Stripe from 'stripe';
import authMiddleware from '../middleware/auth.middleware';
import User from '../models/User';

const router = express.Router();

// Create checkout session for subscription
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    if (!priceId) return res.status(400).json({ error: 'Missing priceId' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

    // Ensure user has a Stripe customer id
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Stripe webhook (unprotected) - expects raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).send('STRIPE_WEBHOOK_SECRET not configured');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

  let event: any;
  try {
    // req.body is a Buffer because of express.raw
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig || '', webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    try {
      const customerId = session.customer as string;
      // find user by stripeCustomerId and update subscriptionStatus
      const user = await User.findOneAndUpdate({ stripeCustomerId: customerId }, { subscriptionStatus: 'active' });
      // optionally handle case where user not found
      console.log('Webhook: checkout.session.completed for customer', customerId);
    } catch (err) {
      console.error('Error handling webhook:', err);
    }
  }

  return res.json({ received: true });
});

export default router;
