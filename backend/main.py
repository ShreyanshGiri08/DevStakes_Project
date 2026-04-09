import os
import json
import uuid
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv

import models
from database import engine, get_db

load_dotenv()
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vector Visionary — Anti-Gravity Learning Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ───
class AIRequest(BaseModel):
    topic: str
    email: str
    time_minutes: int = 60

class AuthRequest(BaseModel):
    email: str

class ProfileSetupRequest(BaseModel):
    email: str
    display_name: str
    photo_url: str

class ProgressRequest(BaseModel):
    email: str
    xp: int

class ExpandNodeRequest(BaseModel):
    parent_title: str
    topic: str
    email: str

class GenerateNotesRequest(BaseModel):
    title: str
    topic_context: str

class GenerateQuizRequest(BaseModel):
    title: str
    topic_context: str

# ─── LLM Setup (Groq primary, Gemini fallback) ───
# Groq: Free, fast, generous rate limits (30 req/min)
# Get your free key at: https://console.groq.com/keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Initialize providers
groq_client = None
if GROQ_API_KEY:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY)

import google.generativeai as genai
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

ANTI_GRAVITY_SYSTEM = """You are 'Vector Visionary Tutor,' a high-energy, elite technical architect and mentor.

RESPONSE FORMAT RULES (CRITICAL - follow these EXACTLY):
1. Always structure responses with clear markdown:
   - Use ### for section headings
   - Use **bold** for key terms and concepts
   - Use bullet points (- item) for lists of concepts, steps, or features
   - Use numbered lists (1. step) for sequential instructions
   - Use `inline code` for code terms and ```code blocks``` for multi-line code
   - Use [Link Text](https://url) for all URLs — make them clickable
2. Keep paragraphs short (2-3 sentences max)
3. Include relevant links:
   - GitHub: [Repo Name](https://github.com/...)
   - GeeksforGeeks: [Article Title](https://www.geeksforgeeks.org/...)
   - Official docs when applicable
4. Be concise, energetic, and technically precise
5. Sign off as 'Vector Visionary 🚀' when appropriate.

Example response structure:
### Topic Name
Brief intro sentence.

**Key Concepts:**
- First concept explanation
- Second concept explanation

**Code Example:**
```
code here
```

**Resources:**
- [Official Docs](https://...)
- [GFG Deep Dive](https://www.geeksforgeeks.org/...)

Vector Visionary 🚀"""

def _call_llm(prompt: str, system: str = ANTI_GRAVITY_SYSTEM) -> str:
    """Call LLM with Groq as primary (fast+free) and Gemini as fallback."""
    import time
    
    # Try Groq first (free, fast, generous limits)
    if groq_client:
        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2048,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq Error: {e}")
    
    # Fallback to Gemini
    if GEMINI_API_KEY:
        for attempt in range(2):
            try:
                model = genai.GenerativeModel(
                    'gemini-2.0-flash',
                    system_instruction=system
                )
                response = model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                err_str = str(e)
                print(f"Gemini Error (attempt {attempt+1}): {err_str}")
                if "429" in err_str or "quota" in err_str.lower():
                    time.sleep((attempt + 1) * 5)
                else:
                    break
    
    return ""

def _parse_json_from_llm(text: str) -> Any:
    """Robustly extract JSON from LLM output that may have markdown fences."""
    text = text.strip()
    # Remove ```json ... ``` wrapper
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None

# ─── Auth Endpoints ───

@app.post("/api/auth/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
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
            "display_name": user.display_name,
            "photo_url": user.profile_photo_url,
            "xp": user.xp,
            "streak_days": user.streak_days,
            "level": user.level
        }
    }

@app.post("/api/user/setup")
def setup_profile(req: ProfileSetupRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.display_name = req.display_name
    user.profile_photo_url = req.photo_url
    db.commit()
    return {"message": "Profile updated"}

@app.post("/api/user/progress")
def sync_progress(req: ProgressRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if user:
        user.xp += req.xp
        user.level = (user.xp // 1000) + 1
        db.commit()
        return {"xp": user.xp, "level": user.level}
    return {"error": "User not found"}

# ─── Roadmap Generation ───

@app.post("/api/generate-roadmap")
def generate_roadmap(req: AIRequest, db: Session = Depends(get_db)):
    roadmap_id = str(uuid.uuid4())
    t = req.topic.title()
    time_mins = req.time_minutes

    # Dynamic node count: short time = fewer nodes, long time = more
    if time_mins <= 20:
        node_count = 4
    elif time_mins <= 40:
        node_count = 5
    elif time_mins <= 60:
        node_count = 6
    elif time_mins <= 90:
        node_count = 8
    else:
        node_count = 10

    prompt = f"""Generate a learning roadmap for '{t}' with EXACTLY {node_count} nodes.
The user has {time_mins} minutes to learn this topic, so adjust depth accordingly.

If {node_count} <= 5: linear path (Intro → Core → Practice → Apply → Summary)
If {node_count} == 6-8: branching tree (Root → 2 beginner → 2-4 intermediate → Mastery)
If {node_count} >= 9: deep multi-branch (Root → 2-3 beginner → 3-4 intermediate → 2-3 advanced → Mastery)

Return ONLY a JSON array of {node_count} objects. No markdown fences. Each object:
{{"title": "Specific Topic Title", "description": "One compelling sentence.", "topicContext": "A rich 2-3 sentence paragraph explaining the concept."}}

Make titles SPECIFIC to '{t}', not generic. For example if the topic is 'React', use titles like 'JSX & Component Composition', 'Hooks & State Management', etc."""

    ai_data = None
    if groq_client or GEMINI_API_KEY:
        raw = _call_llm(prompt)
        ai_data = _parse_json_from_llm(raw)
        if ai_data and len(ai_data) != node_count:
            # Accept close enough
            if ai_data and len(ai_data) >= node_count - 1:
                ai_data = ai_data[:node_count]
            else:
                ai_data = None

    if not ai_data:
        base = [
            {"title": f"Foundations of {t}", "description": f"The entry point into {t}.", "topicContext": f"Understanding the core principles of {t}."},
            {"title": f"{t} Core Concepts", "description": "Essential building blocks.", "topicContext": f"The fundamental abstractions that power {t}."},
            {"title": f"{t} Tooling & Setup", "description": "Environment and workflow.", "topicContext": f"Setting up your environment for {t}."},
            {"title": f"Intermediate {t} Patterns", "description": "Design patterns.", "topicContext": f"Common patterns and architecture in {t}."},
            {"title": f"{t} Data & State", "description": "Managing complexity.", "topicContext": f"Data flow and state management in {t}."},
            {"title": f"Advanced {t} Architecture", "description": "System-level thinking.", "topicContext": f"Scaling {t} to production."},
            {"title": f"{t} in Production", "description": "Real-world deployment.", "topicContext": f"CI/CD, monitoring for {t}."},
            {"title": f"{t} Best Practices", "description": "Industry standards.", "topicContext": f"Following best practices in {t}."},
            {"title": f"{t} Ecosystem", "description": "Tools and community.", "topicContext": f"The broader {t} ecosystem."},
            {"title": f"{t} Mastery", "description": f"The complete {t} engineer.", "topicContext": f"Synthesizing all {t} knowledge."},
        ]
        ai_data = base[:node_count]

    # Dynamic layout based on node count
    nodes, edges = _build_tree_layout(ai_data, node_count)

    new_roadmap = models.Roadmap(id=roadmap_id, topic=req.topic, user_email=req.email, nodes=nodes, edges=edges)
    db.add(new_roadmap)
    db.commit()

    return {"id": roadmap_id, "nodes": nodes, "edges": edges}

def _build_tree_layout(ai_data, count):
    """Build dynamic tree layout based on node count."""
    rewards_map = {4: [100, 200, 350, 500], 5: [100, 200, 200, 350, 500], 6: [100, 200, 200, 350, 500, 1000]}
    diff_map = {4: ['Easy', 'Easy', 'Medium', 'Hard'], 5: ['Easy', 'Easy', 'Easy', 'Medium', 'Hard'], 6: ['Easy', 'Easy', 'Easy', 'Medium', 'Hard', 'Hard']}

    nodes = []
    edges = []

    if count <= 5:
        # Linear path
        for i in range(count):
            nodes.append({
                "id": str(i+1), "type": "topic",
                "position": {"x": 400, "y": i * 180},
                "data": {
                    "title": ai_data[i]["title"], "description": ai_data[i]["description"],
                    "status": "available" if i == 0 else "locked",
                    "xpReward": rewards_map.get(count, [100]*count)[i] if i < len(rewards_map.get(count, [])) else 300,
                    "difficulty": diff_map.get(count, ['Medium']*count)[i] if i < len(diff_map.get(count, [])) else 'Medium',
                    "topicContext": ai_data[i].get("topicContext", "")
                }
            })
            if i > 0:
                edges.append({"id": f"e{i}-{i+1}", "source": str(i), "target": str(i+1), "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}})
    elif count <= 8:
        # Diamond tree: 1 root → 2 branches → middle nodes → 1 mastery
        mid_count = count - 3  # root + 2 branches + mastery = 4, rest is middle
        positions = [{"x": 400, "y": 0}]  # root
        positions.append({"x": 150, "y": 200})  # left branch
        positions.append({"x": 650, "y": 200})  # right branch
        for j in range(mid_count):
            x_offset = j * (800 // max(mid_count, 1))
            positions.append({"x": x_offset, "y": 400})
        positions.append({"x": 400, "y": 600})  # mastery

        rewards = [100, 200, 200] + [350] * mid_count + [1000]
        diffs = ['Easy', 'Easy', 'Easy'] + ['Medium'] * mid_count + ['Hard']

        for i in range(count):
            nodes.append({
                "id": str(i+1), "type": "topic",
                "position": positions[i],
                "data": {
                    "title": ai_data[i]["title"], "description": ai_data[i]["description"],
                    "status": "available" if i == 0 else "locked",
                    "xpReward": rewards[i], "difficulty": diffs[i],
                    "topicContext": ai_data[i].get("topicContext", "")
                }
            })

        # Edges: root→2,3  2→middle_left  3→middle_right  all_middle→mastery
        edges.append({"id": "e1-2", "source": "1", "target": "2", "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}})
        edges.append({"id": "e1-3", "source": "1", "target": "3", "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}})
        for j in range(mid_count):
            src = "2" if j < mid_count // 2 else "3"
            edges.append({"id": f"e{src}-{j+4}", "source": src, "target": str(j+4), "animated": True, "style": {"stroke": "#6366f1", "strokeWidth": 2}})
        mastery_id = str(count)
        for j in range(mid_count):
            edges.append({"id": f"e{j+4}-{mastery_id}", "source": str(j+4), "target": mastery_id, "animated": True, "style": {"stroke": "#8b5cf6", "strokeWidth": 2}})
    else:
        # Large tree: 1 root → 3 branches → middle → 2 advanced → mastery
        positions = [
            {"x": 400, "y": 0},
            {"x": 50, "y": 180}, {"x": 400, "y": 180}, {"x": 750, "y": 180},
            {"x": 0, "y": 360}, {"x": 250, "y": 360}, {"x": 500, "y": 360}, {"x": 750, "y": 360},
            {"x": 200, "y": 540}, {"x": 600, "y": 540},
        ]
        rewards = [100, 150, 150, 150, 300, 300, 300, 300, 500, 1000]
        diffs = ['Easy', 'Easy', 'Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard']

        for i in range(min(count, len(positions))):
            nodes.append({
                "id": str(i+1), "type": "topic",
                "position": positions[i],
                "data": {
                    "title": ai_data[i]["title"], "description": ai_data[i]["description"],
                    "status": "available" if i == 0 else "locked",
                    "xpReward": rewards[i], "difficulty": diffs[i],
                    "topicContext": ai_data[i].get("topicContext", "")
                }
            })

        tree_edges = [(1,2),(1,3),(1,4),(2,5),(2,6),(3,6),(3,7),(4,7),(4,8),(5,9),(6,9),(7,10),(8,10)]
        for s, t2 in tree_edges:
            if s <= count and t2 <= count:
                edges.append({"id": f"e{s}-{t2}", "source": str(s), "target": str(t2), "animated": True, "style": {"stroke": "#6366f1", "strokeWidth": 2}})

    return nodes, edges

# ─── Dynamic Content Generation ───

@app.post("/api/generate-notes")
def generate_notes(req: GenerateNotesRequest):
    """Generate rich handwritten-style notes via Gemini."""
    prompt = f"""Write comprehensive study notes for '{req.title}'.
Context: {req.topic_context}

Structure your notes as follows (return as JSON):
{{
  "heading": "Title of the concept",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "explanation": "A thorough 4-5 sentence explanation connecting theory to practice.",
  "codeExample": "A properly formatted multi-line code snippet with real newlines (use \\n for line breaks). Include proper indentation. Must be at least 4-8 lines of real, working code. If no code is relevant, use empty string.",
  "proTip": "One expert-level insight that most learners miss.",
  "connections": "How this topic connects to the broader ecosystem (2 sentences)."
}}

CRITICAL for codeExample: Use actual newline characters (\\n) and spaces for indentation inside the JSON string. Example:
"codeExample": "function greet(name) {{\n  const msg = `Hello, ${{name}}`;\n  console.log(msg);\n  return msg;\n}}"

Return ONLY the JSON object. No markdown fences."""

    if groq_client or GEMINI_API_KEY:
        raw = _call_llm(prompt)
        parsed = _parse_json_from_llm(raw)
        if parsed:
            return {"notes": parsed, "source": "ai"}

    return {"notes": {
        "heading": req.title,
        "keyPoints": [
            f"{req.title} is a foundational concept.",
            "It bridges theory and practical implementation.",
            "Understanding prerequisites is critical.",
            "Real-world applications are widespread.",
            "Mastery requires iterative practice."
        ],
        "explanation": req.topic_context or f"{req.title} establishes core patterns used across the domain.",
        "codeExample": "",
        "proTip": f"The secret to mastering {req.title} is to build small projects that force you to apply each concept.",
        "connections": f"{req.title} connects deeply to adjacent domains. Understanding it unlocks pathways to more advanced topics."
    }, "source": "fallback"}

@app.post("/api/generate-quiz")
def generate_quiz(req: GenerateQuizRequest):
    """Generate 5 quiz questions via Gemini."""
    prompt = f"""Create exactly 5 multiple-choice quiz questions about '{req.title}'.
Context: {req.topic_context}

Return ONLY a JSON array of 5 objects. No markdown fences. Each object:
{{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}}

Make questions specific, educational, and progressively harder. The correctIndex is 0-based."""

    if groq_client or GEMINI_API_KEY:
        raw = _call_llm(prompt)
        parsed = _parse_json_from_llm(raw)
        if parsed and isinstance(parsed, list) and len(parsed) >= 3:
            return {"quiz": parsed[:5], "source": "ai"}

    return {"quiz": [
        {"question": f"What is the primary purpose of {req.title}?", "options": ["Decoration", "Core functionality", "Legacy support", "None"], "correctIndex": 1},
        {"question": f"Which principle is central to {req.title}?", "options": ["Abstraction", "Randomness", "Obfuscation", "Deletion"], "correctIndex": 0},
        {"question": f"When should you use {req.title}?", "options": ["Never", "Only in testing", "When the problem domain requires it", "Always"], "correctIndex": 2},
        {"question": f"What is a common mistake with {req.title}?", "options": ["Over-engineering", "Using it correctly", "Reading documentation", "Testing thoroughly"], "correctIndex": 0},
        {"question": f"How does {req.title} connect to the broader ecosystem?", "options": ["It doesn't", "Through shared abstractions", "Only via APIs", "Through UI only"], "correctIndex": 1},
    ], "source": "fallback"}

# ─── AI Tutor Chat ───

@app.post("/api/ai-tutor/chat")
def ai_chat(req: Dict[Any, Any]):
    message = req.get("message", "")
    topic = req.get("topic", "the concept")

    if groq_client or GEMINI_API_KEY:
        prompt = f"The student is studying '{topic}' and asks: '{message}'. Provide a helpful, specific answer in 2-4 sentences. Include a practical example if relevant."
        reply = _call_llm(prompt)
        if reply:
            return {"reply": reply}

    # Fallback
    msg_lower = message.lower()
    if "how" in msg_lower or "explain" in msg_lower:
        reply = f"Great question about {topic}! Think of it like building blocks — each concept layers on top of the previous one. The key is understanding the 'why' behind each layer."
    elif "example" in msg_lower:
        reply = f"Here's how {topic} works in practice: You start by defining your constraints, then implement the core logic, and finally test against edge cases."
    elif "resource" in msg_lower or "link" in msg_lower:
        reply = f"Check out the GeeksforGeeks article on {topic} and search GitHub for '{topic} examples'. These are goldmines for real-world patterns."
    else:
        reply = f"I'm Vector Visionary Tutor 🚀, your AI guide for '{topic}'. Ask me how concepts work, for examples, or for resource recommendations!"

    return {"reply": reply}

# ─── History ───

@app.get("/api/history/{email}")
def get_history(email: str, db: Session = Depends(get_db)):
    roadmaps = db.query(models.Roadmap).filter(models.Roadmap.user_email == email).all()
    result = [{"id": r.id, "topic": r.topic, "nodes": r.nodes, "edges": r.edges} for r in roadmaps]
    return {"history": result}

# ─── Personalized Suggestions ───

class SuggestionsRequest(BaseModel):
    topics: List[str]

@app.post("/api/suggestions")
def get_suggestions(req: SuggestionsRequest):
    if not req.topics:
        return {"suggestions": ["Python", "Data Structures", "System Design"]}
    
    recent = ", ".join(req.topics[:5])
    prompt = f"""Based on the user's history of learning about [{recent}], suggest exactly 3 related advanced topics they should explore next. Return ONLY a JSON array of 3 strings. No markdown fences. Example: ["Topic A", "Topic B", "Topic C"]"""
    
    if groq_client or GEMINI_API_KEY:
        raw = _call_llm(prompt)
        parsed = _parse_json_from_llm(raw)
        if parsed and isinstance(parsed, list):
            return {"suggestions": parsed[:3]}
    
    # Fallback
    return {"suggestions": [f"Advanced {req.topics[0]}", "System Design", "Software Architecture"]}
