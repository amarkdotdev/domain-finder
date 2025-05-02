#!/usr/bin/env python3
"""
FastAPI backend for Domainly with request logging.

Logs every prompt to a Postgres table `prompt_log`:

    id            SERIAL PRIMARY KEY
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
    ip            TEXT
    user_agent    TEXT
    idea          TEXT
    suggestions   JSONB
"""

from __future__ import annotations

import os
import json
from typing import List, Dict

import requests
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (create_engine, Column, Integer, Text,
                        DateTime, func, JSON)
from sqlalchemy.orm import declarative_base, Session, sessionmaker
from google import genai

# --------------------------------------------------------------------------- #
# FastAPI                                                                    #
# --------------------------------------------------------------------------- #

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://domainly.me", "https://www.domainly.me"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Database                                                                    #
# --------------------------------------------------------------------------- #

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://domainly:supersecret@localhost:5432/domainly",  # fallback for local dev
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()


class PromptLog(Base):
    __tablename__ = "prompt_log"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip = Column(Text)
    user_agent = Column(Text)
    idea = Column(Text)
    suggestions = Column(JSON)


Base.metadata.create_all(bind=engine)  # auto‑create table on first run


def db_session():
    """Dependency that yields a SQLAlchemy session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------------------------------- #
# Schemas                                                                     #
# --------------------------------------------------------------------------- #

class IdeaRequest(BaseModel):
    idea: str


# --------------------------------------------------------------------------- #
# Routes                                                                      #
# --------------------------------------------------------------------------- #

@app.post("/suggest-domains", response_model=List[str])
def suggest_domains(
    request_body: IdeaRequest,
    request: Request,              # access IP / User‑Agent
    db: Session = Depends(db_session),
):
    idea = request_body.idea.strip()
    if not idea or len(idea) < 5:
        raise HTTPException(status_code=400, detail="Idea description too short.")

    collected: List[str] = []
    seen_domains: set[str] = set()
    max_total_domains = 200

    while len(collected) < 10 and len(seen_domains) < max_total_domains:
        suggestions = get_ai_suggestions(idea)
        suggestions = [d for d in suggestions if d not in seen_domains]
        seen_domains.update(suggestions)

        if not suggestions:
            break

        availability_results = check_domain_availability_bulk(suggestions)

        for item in availability_results:
            if item["available"]:
                collected.append(item["domain"])
                if len(collected) >= 10:
                    break

    # ----------------------------- logging -------------------------------- #
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    user_agent = request.headers.get("user-agent", "unknown")

    db.add(
        PromptLog(
            ip=client_ip,
            user_agent=user_agent,
            idea=idea,
            suggestions=collected,
        )
    )
    db.commit()
    # ---------------------------------------------------------------------- #

    return collected


# --------------------------------------------------------------------------- #
# Helpers                                                                     #
# --------------------------------------------------------------------------- #

def get_ai_suggestions(idea: str) -> List[str]:
    api_key_goog = os.getenv("GOOGLE_AI_STUDIO_API_KEY")
    if not api_key_goog:
        raise HTTPException(500, "Google AI Studio key not configured")

    client = genai.Client(api_key=api_key_goog)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=(
            "Give me 10 short creative domain name ideas for a startup about "
            f"'{idea}'. Only return a clean comma‑separated list like: ideaone.com, ideatwo.com..."
        ),
    )
    domains = [x.strip() for x in response.text.split(",") if x.strip()]
    return domains


def check_domain_availability_bulk(domains: List[str]) -> List[Dict[str, bool]]:
    godaddy_api_key = os.getenv("GODADDY_API_KEY")
    godaddy_api_secret = os.getenv("GODADDY_API_SECRET")
    if not godaddy_api_key or not godaddy_api_secret:
        raise HTTPException(500, "GoDaddy API credentials missing")

    url = "https://api.ote-godaddy.com/v1/domains/available"
    headers = {
        "Authorization": f"sso-key {godaddy_api_key}:{godaddy_api_secret}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            url,
            params={"checkType": "FAST"},
            headers=headers,
            json=domains,
            timeout=10,
        )
        data = response.json()
        if "errors" in data:
            print("GoDaddy errors:", data["errors"])
        return data.get("domains", [])
    except requests.RequestException as exc:
        print("GoDaddy API exception:", exc)
        raise HTTPException(502, "GoDaddy API error")
