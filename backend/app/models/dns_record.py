from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True)
    hosted_zone_id = Column(Integer, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, index=True, nullable=False) # e.g. "www.example.com."
    type = Column(String, index=True, nullable=False) # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA
    ttl = Column(Integer, nullable=False, default=300)
    value = Column(String, nullable=False) # Store record values (for multi-value we can store line breaks or JSON, Route53 allows one value per line or multiple rows. We will store simple single value or newline-separated values in this field. A normalized string is clean.)
    routing_policy = Column(String, nullable=False, default="Simple") # Simple, Weighted, Latency, Failover, Geolocation, etc.
    alias = Column(Boolean, default=False, nullable=False)
    health_check_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
