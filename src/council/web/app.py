"""FastAPI application for Council Web UI."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from council.web.routes import router

STATIC_DIR = Path(__file__).parent / "static"


def create_app() -> FastAPI:
    app = FastAPI(
        title="Council",
        description="Local web UI for Council multi-agent debates",
        version="0.1.0",
    )

    # Allow local CORS for Vite dev server (usually localhost:5173)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routes
    app.include_router(router)

    # Static assets and SPA fallback
    if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            target = STATIC_DIR / full_path
            if target.exists() and target.is_file():
                return FileResponse(target)
            return FileResponse(STATIC_DIR / "index.html")
    else:
        @app.get("/")
        async def root():
            return HTMLResponse(
                "<html><body><h1>Council Web UI</h1>"
                "<p>API is running. Build frontend static assets to view the web client.</p>"
                "</body></html>"
            )

    return app


app = create_app()
