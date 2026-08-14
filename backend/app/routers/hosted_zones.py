from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZonePagination
)
from app.services import hosted_zone_service
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/hosted-zones", tags=["hosted-zones"])

@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    zone_in: HostedZoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if a zone with this name already exists for this user to avoid conflicts
    # Route53 allows duplicate domain names, but it is often better to keep it clean, or let's allow it as Route53 does.
    # We will allow it but generate unique Zone IDs.
    return hosted_zone_service.create_hosted_zone(db, zone_in, current_user.id)

@router.get("", response_model=HostedZonePagination)
def list_zones(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items, total, total_pages = hosted_zone_service.get_hosted_zones(
        db, current_user.id, page, page_size, search, type
    )
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
    return db_zone

@router.patch("/{zone_id}", response_model=HostedZoneResponse)
def update_zone(
    zone_id: str,
    zone_in: HostedZoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
    return hosted_zone_service.update_hosted_zone(db, db_zone, zone_in)

@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not db_zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
    hosted_zone_service.delete_hosted_zone(db, db_zone)
    return None
