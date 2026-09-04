# Installation

This guide walks you through setting up X.A.V.I.E.R. for local development. The project is split into a Python FastAPI backend (`server/`) and a React Vite frontend (`client/`).

## Prerequisites
- **Python 3.11+** (Python 3.14 is currently unsupported due to `pydantic-core` rust dependencies)
- **Node.js 18+**
- **npm 9+**

## Backend Setup (FastAPI)

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy the `.env.example` (see [Configuration](configuration.md)) to `.env` and fill in your keys.

5. **Start the development server:**
   ```bash
   uvicorn main:app --port 3001 --reload
   ```
   The backend is now running at `http://localhost:3001`.

## Frontend Setup (Vite + React)

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend is now running at `http://localhost:5173`.
