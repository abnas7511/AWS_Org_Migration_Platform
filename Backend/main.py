from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.steps import router as steps_router
from app.api.routes.account_management import router as account_router

app = FastAPI(title="AWS Migration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(steps_router, prefix="/api")
app.include_router(account_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AWS Migration API is running"}


#uvicorn main:app --port 8005 --reload --host 0.0.0.0