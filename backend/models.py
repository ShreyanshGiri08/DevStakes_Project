from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    display_name = Column(String, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    level = Column(Integer, default=1)

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(String, primary_key=True, index=True) # e.g. "uuid"
    topic = Column(String, index=True)
    user_email = Column(String, ForeignKey("users.email"))
    nodes = Column(JSON) # Store React Flow compatible node arrays
    edges = Column(JSON) # Store React Flow edges array
