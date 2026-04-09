from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid

import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vector Visionary AI Learning Platform APIs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIRequest(BaseModel):
    topic: str
    email: str

class AuthRequest(BaseModel):
    email: str

@app.get("/")
def read_root():
    return {"message": "Universal AI Learning Platform Backend running"}

@app.post("/api/auth/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    """Pseudo-login endpoint. Creates user if they don't exist."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        user = models.User(email=req.email, xp=0, streak_days=0, level=1)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "message": "Login successful",
        "user": {
            "email": user.email,
            "xp": user.xp,
            "streak_days": user.streak_days,
            "level": user.level
        }
    }

@app.post("/api/generate-roadmap")
def generate_roadmap(req: AIRequest, db: Session = Depends(get_db)):
    """Mock AI generator that outputs a graph dataset dynamically injected with the topic."""
    
    roadmap_id = str(uuid.uuid4())
    
    t = req.topic.title()
    
    # Mock AI response formatting a skill tree dynamically based on topic
    mock_nodes = [
        {
            "id": "1", "type": "topic", "position": {"x": 400, "y": 100},
            "data": {
                "title": f"Intro to {t}", 
                "description": f"Fundamentals of {t} history and core concepts.",
                "status": "completed", 
                "xpReward": 100, 
                "difficulty": "Easy"
            }
        },
        {
            "id": "2", "type": "topic", "position": {"x": 300, "y": 300},
            "data": {
                "title": f"Core {t} Mechanics", 
                "description": f"Deep dive into exactly how {t} structures work.",
                "status": "available", 
                "xpReward": 250, 
                "difficulty": "Medium"
            }
        },
        {
            "id": "3", "type": "topic", "position": {"x": 500, "y": 300},
            "data": {
                "title": f"Advanced {t}", 
                "description": f"Master the complex concepts of {t}.",
                "status": "locked", 
                "xpReward": 500, 
                "difficulty": "Hard"
            }
        }
    ]
    
    mock_edges = [
        {"id": "e1-2", "source": "1", "target": "2", "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}},
        {"id": "e1-3", "source": "1", "target": "3", "animated": False, "style": {"stroke": "#475569", "strokeWidth": 2}}
    ]
    
    new_roadmap = models.Roadmap(
        id=roadmap_id, 
        topic=req.topic, 
        user_email=req.email,
        nodes=mock_nodes, 
        edges=mock_edges
    )
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)
    
    return {
        "id": roadmap_id,
        "nodes": mock_nodes,
        "edges": mock_edges
    }

@app.get("/api/history/{email}")
def get_history(email: str, db: Session = Depends(get_db)):
    """Returns saved roadmaps for the user's email."""
    roadmaps = db.query(models.Roadmap).filter(models.Roadmap.user_email == email).all()
    
    result = []
    for r in roadmaps:
        result.append({
            "id": r.id,
            "topic": r.topic,
            "nodes": r.nodes,
            "edges": r.edges
        })
    return {"history": result}

@app.get("/api/ai-tutor/{node_id}")
def get_ai_tutor_explanation(node_id: str):
    """Mock AI endpoint for Deep Dive content generation."""
    return {
        "analogy": f"Think of node {node_id} like a puzzle piece that connects the overarching framework together.",
        "quiz": [
            {
                "question": "What is the primary function of this concept?",
                "options": ["A", "B", "C", "D"],
                "answer": "B"
            }
        ]
    }
