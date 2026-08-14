from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    type = Column(String, default="public", nullable=False) # "public" or "private"
    description = Column(String, nullable=True)
    private_zone = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="hosted_zones")
    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")
