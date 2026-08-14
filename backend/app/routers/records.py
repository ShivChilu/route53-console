from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.dns_record import (
    DNSRecordCreate,
    DNSRecordUpdate,
    DNSRecordResponse,
    DNSRecordPagination
)
from app.services import record_service, hosted_zone_service
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["records"])

@router.post("", response_model=DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_dns_record(
    zone_id: str,
    record_in: DNSRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
    return record_service.create_record(db, zone, record_in)

@router.get("", response_model=DNSRecordPagination)
def list_dns_records(
    zone_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
    items, total, total_pages = record_service.get_records(
        db, zone.id, page, page_size, search, type
    )
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.patch("/{record_id}", response_model=DNSRecordResponse)
def update_dns_record(
    zone_id: str,
    record_id: int,
    record_in: DNSRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
    
    # Get record and verify ownership
    db_record = db.query(record_service.DNSRecord).filter(
        record_service.DNSRecord.id == record_id,
        record_service.DNSRecord.hosted_zone_id == zone.id
    ).first()
    
    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DNS record not found"
        )
        
    return record_service.update_record(db, db_record, record_in)

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dns_record(
    zone_id: str,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    zone = hosted_zone_service.get_hosted_zone_by_id(db, zone_id, current_user.id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found"
        )
        
    db_record = db.query(record_service.DNSRecord).filter(
        record_service.DNSRecord.id == record_id,
        record_service.DNSRecord.hosted_zone_id == zone.id
    ).first()
    
    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DNS record not found"
        )
        
    record_service.delete_record(db, db_record)
    return None
