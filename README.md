<div align="center">
  <img src="https://raw.githubusercontent.com/V1629/X.A.V.I.E.R./main/client/public/logo.png" alt="X.A.V.I.E.R. Logo" width="150" style="border-radius: 50%;" />

  <h1 align="center">X.A.V.I.E.R.</h1>
  <p align="center">
    <strong>eXtended Autonomous Virtual Intelligence Engine for Recovery</strong>
  </p>
  
  <p align="center">
    An autonomous AI orchestrator that sits between your payment gateways and your customers to instantly diagnose failures, route around downtime, and intelligently recover lost revenue.
  </p>

  <p align="center">
    <a href="https://github.com/V1629/X.A.V.I.E.R./stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/V1629/X.A.V.I.E.R.?style=for-the-badge&color=blue"></a>
    <a href="https://github.com/V1629/X.A.V.I.E.R./network"><img alt="GitHub forks" src="https://img.shields.io/github/forks/V1629/X.A.V.I.E.R.?style=for-the-badge&color=blue"></a>
    <a href="https://github.com/V1629/X.A.V.I.E.R./blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/V1629/X.A.V.I.E.R.?style=for-the-badge&color=blue"></a>
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi">
    <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
    <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  </p>
</div>

---

## Powering Modern Payments

X.A.V.I.E.R. is not just a dashboard—it's an autonomous orchestrator. When a transaction fails, it catches the webhook, uses a Large Language Model (like Llama-3 via Groq) to decipher cryptic bank error codes, and automatically executes a recovery strategy without human intervention.

### Features
- **AI Diagnoser:** Translates `E001` or `INSUFFICIENT_FUNDS` into actionable recovery steps.
- **Smart Routing:** Detects when a primary gateway (Razorpay) is experiencing downtime and seamlessly generates a fallback session (Stripe).
- **Hyper-Personalized Nudges:** Dispatches tailored recovery emails via Resend based on the customer's exact failure reason.
- **Governance Engine:** Built-in safeguards including daily spend limits and kill switches.

---

## Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Groq-1E1E1E?style=for-the-badge&logo=ai&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" alt="Razorpay" />
  <img src="https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=gmail&logoColor=white" alt="Resend" />
</div>

---

## 60-Second Quickstart

**1. Clone the Repository**
```bash
git clone https://github.com/V1629/X.A.V.I.E.R..git
cd X.A.V.I.E.R.
```

**2. Start the Backend (FastAPI)**
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

**3. Start the Frontend (Vite + React)**
```bash
# In a new terminal
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` to view the beautiful Agent Terminal Dashboard!

---

## Extensive Documentation

X.A.V.I.E.R. is fully documented. Dive into the complete open-source-grade documentation set to learn how the orchestrator works under the hood.

**[Enter the Documentation Hub](docs/README.md)**

| Section | Description |
|---------|-------------|
| **[Getting Started](docs/getting-started/installation.md)** | Step-by-step installation, `.env` config, and seeding data. |
| **[Architecture](docs/architecture/overview.md)** | High-level system design, Agent pipeline, and sequence diagrams. |
| **[API Reference](docs/api-reference/rest-endpoints.md)** | Full REST endpoints mapping and Realtime SSE event schemas. |
| **[Frontend](docs/frontend/overview.md)** | React component structure and hybrid SSE/REST data flow. |
| **[Development](docs/development/extending.md)** | How to extend X.A.V.I.E.R. with new gateways and recovery strategies. |

---

<div align="center">
  <p>Built for autonomous agents.</p>
</div>
