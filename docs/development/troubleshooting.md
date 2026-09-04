# Troubleshooting

Common issues and how to resolve them during local development.

## 1. Rust / Maturin Build Failures on Deploy

**Symptom:** When deploying to Render or installing `requirements.txt`, you see an error like `metadata-generation-failed -> pydantic-core` and a Rust read-only filesystem error.

**Cause:** Render or your local machine is attempting to install using Python 3.14 (or another experimental version) which lacks pre-built wheel binaries for `pydantic-core`. `pip` falls back to building it from source using Rust (`maturin`), which fails in restricted environments.

**Fix:** Ensure you are using a stable Python version (like 3.11.x or 3.12.x). A `.python-version` file containing `3.11.9` is included in the `server/` directory to force Render to use this version. 

## 2. Agent Not Triggering on Checkout

**Symptom:** You click "Pay" in the Store, it fails, but the Agent Terminal shows nothing.

**Cause:** The frontend expects the backend at `http://localhost:3001`. If it's running on a different port, the `ReportFailure` request will fail.

**Fix:** Check your `VITE_API_URL` in the client environment, or ensure the server is started precisely with `uvicorn main:app --port 3001`.

## 3. Empty Nudges or Template Fallbacks

**Symptom:** The recovery email text reads: `"Hi, your payment of ₹X failed. Please update your card."` instead of a hyper-personalized message.

**Cause:** The Groq API key is missing or invalid, causing the LLM to throw an exception. The system automatically falls back to a static template to ensure the customer still receives a notification.

**Fix:** Verify `GROQ_API_KEY` in `server/.env`.

## 4. `uvicorn: command not found`

**Symptom:** Cannot start the server.

**Cause:** You haven't activated the Python virtual environment.

**Fix:** 
```bash
source venv/bin/activate
pip install -r requirements.txt
```
