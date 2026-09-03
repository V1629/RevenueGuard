from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from app.api.routes import router
from app.data.seed_data import seed_database

# Load environment variables
load_dotenv()

app = FastAPI(title="X.A.V.I.E.R.", description="Agent Engine API")

# Setup CORS to allow React frontend (port 5173 or 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.on_event("startup")
def startup_event():
    # Database starts empty. User can seed from UI if needed for judges.
    print("Database is starting fresh.")
    print("==========================================")
    print("   X.A.V.I.E.R. — Agent Engine             ")
    print("   Running on http://localhost:3001       ")
    print("   SSE endpoint: /api/events              ")
    print("==========================================")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
