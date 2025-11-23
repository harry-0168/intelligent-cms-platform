from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import audit, campaigns, generate

load_dotenv()

app = FastAPI(title="Intelligent CMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(audit.router)
app.include_router(campaigns.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
