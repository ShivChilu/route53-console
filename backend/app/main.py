from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from app.database import engine, get_db, Base
from app.routers import auth, hosted_zones, records
from app.dependencies import get_current_user
from app.models.user import User
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord

# Auto-create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AWS Route 53 Clone API", version="1.0.0")

# CORS setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# Allow configuration from env var
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins.extend([origin.strip() for origin in cors_origins_env.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(hosted_zones.router, prefix="/api")
app.include_router(records.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "route53-clone-api"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total zones
    zone_count = db.query(HostedZone).filter(HostedZone.user_id == current_user.id).count()
    
    # Total records for all zones belonging to this user
    record_count = db.query(DNSRecord).join(HostedZone).filter(HostedZone.user_id == current_user.id).count()
    
    # Recent activity - e.g. last 5 created zones or records
    recent_zones = db.query(HostedZone).filter(
        HostedZone.user_id == current_user.id
    ).order_by(HostedZone.created_at.desc()).limit(3).all()
    
    activities = []
    for rz in recent_zones:
        activities.append({
            "type": "zone_created",
            "message": f"Hosted zone '{rz.name}' was created",
            "timestamp": rz.created_at,
            "metadata": {"zone_id": rz.zone_id, "name": rz.name}
        })
        
    return {
        "hosted_zones_count": zone_count,
        "dns_records_count": record_count,
        "recent_activities": activities
    }
