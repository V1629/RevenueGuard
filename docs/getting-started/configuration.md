# Configuration

X.A.V.I.E.R. relies on environment variables to connect to payment gateways (Razorpay, Stripe), LLM providers (Groq), and email dispatchers (Resend). 

All environment variables must be placed in a `.env` file inside the `server/` directory.

## Verified Environment Variables

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | *None* | Used by the Diagnoser agent to run LLM inferences on bank error codes. |
| `PORT` | No | `3001` | The port the FastAPI server binds to. |
| `NODE_ENV` | No | `development` | Environment context. |
| `RAZORPAY_KEY_ID` | Yes | *None* | Public identifier for the Razorpay API. |
| `RAZORPAY_KEY_SECRET` | Yes | *None* | Secret key for the Razorpay API. |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | *None* | Used to verify incoming webhooks from Razorpay. |
| `STRIPE_PUBLISHABLE_KEY` | Yes | *None* | Public identifier for the Stripe API (used as fallback). |
| `STRIPE_SECRET_KEY` | Yes | *None* | Secret key for the Stripe API. |
| `RESEND_API_KEY` | Yes | *None* | Used to dispatch hyper-personalized nudge emails. |

## `.env.example`

```env
# server/.env

# AI Provider
GROQ_API_KEY=gsk_your_groq_api_key_here

# Server config
PORT=3001
NODE_ENV=development

# Payment Gateways
RAZORPAY_KEY_ID=rzp_test_yourkey
RAZORPAY_KEY_SECRET=yoursecret
RAZORPAY_WEBHOOK_SECRET=yourwebhooksecret

STRIPE_PUBLISHABLE_KEY=pk_test_yourkey
STRIPE_SECRET_KEY=sk_test_yoursecret

# Communications
RESEND_API_KEY=re_your_resend_key
```

> **Note:** The frontend currently infers the backend URL from the `VITE_API_URL` environment variable. If deploying the frontend to Vercel, ensure you set `VITE_API_URL=https://your-backend.onrender.com`. In local dev, it falls back to `http://localhost:3001`.
