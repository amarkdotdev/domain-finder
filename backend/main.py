from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import requests
import os
from google import genai
from typing import List, Dict



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IdeaRequest(BaseModel):
    idea: str

class DomainSuggestion(BaseModel):
    name: str
    available: bool

@app.post("/suggest-domains", response_model=List[str])
def suggest_domains(request: IdeaRequest):
    idea = request.idea
    collected = []
    seen_domains = set()
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

    return collected



def get_ai_suggestions(idea: str) -> List[str]:
    api_key_goog = os.getenv("GOOGLE_AI_STUDIO_API_KEY")

    client = genai.Client(api_key=api_key_goog)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"Give me 10 short creative domain name ideas for a startup about '{idea}'. "
        f"Only return a clean comma-separated list like: ideaone.com, ideatwo.com..."
    )
    print(response.text)

    domains = [x.strip() for x in response.text.split(",") if x.strip()]
    return domains


def check_domain_availability_bulk(domains: List[str]) -> Dict[str, bool]:

    godaddy_api_key = os.getenv("GODADDY_API_KEY")
    godaddy_api_secret= os.getenv("GODADDY_API_SECRET")


    if not godaddy_api_key or not godaddy_api_secret:
        raise HTTPException(status_code=500, detail="GoDaddy API credentials missing")

    url = os.getenv("GODADDY_API_URL")
    headers = {
        "Authorization": f"sso-key {godaddy_api_key}:{godaddy_api_secret}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            url,
            params={"checkType": "FAST"},
            headers=headers,
            json=domains  # just the list, not {"domains": [...]}
        )
        if response.status_code != 200:
            print("GoDaddy error:", response.text)
            raise HTTPException(status_code=502, detail="GoDaddy API error")

        return response.json()["domains"]


    except Exception as e:
        print("GoDaddy API Exception:", str(e))
        raise HTTPException(status_code=502, detail="GoDaddy API exception")
