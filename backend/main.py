from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
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
    time_estimate: str

@app.get("/")
def read_root():
    return {"message": "Universal AI Learning Platform Backend running"}

@app.post("/api/generate-roadmap")
def generate_roadmap(req: AIRequest, db: Session = Depends(get_db)):
    """Mock AI generator that outputs a graph dataset based on the topic."""
    
    roadmap_id = str(uuid.uuid4())
    
    # Mock AI response formatting a skill tree
    mock_nodes = [
        {
            "id": "1", "type": "topic", "position": {"x": 400, "y": 100},
            "data": {
                "title": f"Intro to {req.topic}", 
                "description": f"Fundamentals of {req.topic}",
                "status": "completed", 
                "xpReward": 100, 
                "difficulty": "Easy"
            }
        },
        {
            "id": "2", "type": "topic", "position": {"x": 300, "y": 300},
            "data": {
                "title": f"Core {req.topic} Mechanics", 
                "description": f"Deep dive into exactly how {req.topic} works.",
                "status": "available", 
                "xpReward": 250, 
                "difficulty": "Medium"
            }
        },
        {
            "id": "3", "type": "topic", "position": {"x": 500, "y": 300},
            "data": {
                "title": f"Advanced {req.topic}", 
                "description": "Master the complex concepts.",
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
    
    new_roadmap = models.Roadmap(id=roadmap_id, topic=req.topic, nodes=mock_nodes, edges=mock_edges)
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)
    
    return {
        "id": roadmap_id,
        "nodes": mock_nodes,
        "edges": mock_edges
    }

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
