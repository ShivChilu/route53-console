from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.dns_record import DNSRecord
from app.models.hosted_zone import HostedZone
from app.schemas.dns_record import DNSRecordCreate, DNSRecordUpdate
from fastapi import HTTPException, status
from app.schemas.dns_record import DNSRecordBase

def format_record_name(record_name: str, zone_name: str) -> str:
    record_name = record_name.strip().lower()
    zone_name = zone_name.strip().lower()
    
    # Ensure trailing dots on zone name
    if not zone_name.endswith("."):
        zone_name = f"{zone_name}."
        
    if record_name == "@" or record_name == "":
        return zone_name
        
    if not record_name.endswith("."):
        # If it doesn't end with the zone name, append it
        if not record_name.endswith(zone_name[:-1]):
            record_name = f"{record_name}.{zone_name}"
        else:
            record_name = f"{record_name}."
            
    return record_name

def get_records(
    db: Session,
    zone_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str = None,
    rec_type: str = None
):
    query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                DNSRecord.name.ilike(search_term),
                DNSRecord.value.ilike(search_term)
            )
        )

    if rec_type:
        query = query.filter(DNSRecord.type == rec_type.upper())

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(DNSRecord.type.asc(), DNSRecord.name.asc()).offset(offset).limit(page_size).all()
    
    total_pages = max(1, (total + page_size - 1) // page_size)
    return items, total, total_pages

def create_record(db: Session, zone: HostedZone, record_in: DNSRecordCreate) -> DNSRecord:
    formatted_name = format_record_name(record_in.name, zone.name)
    
    # Check if duplicate record with same name + type + routing policy exists
    duplicate = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone.id,
        DNSRecord.name == formatted_name,
        DNSRecord.type == record_in.type,
        DNSRecord.routing_policy == record_in.routing_policy
    ).first()
    
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A DNS record with name '{formatted_name}' and type '{record_in.type}' already exists."
        )

    db_record = DNSRecord(
        hosted_zone_id=zone.id,
        name=formatted_name,
        type=record_in.type,
        ttl=record_in.ttl,
        value=record_in.value,
        routing_policy=record_in.routing_policy,
        alias=record_in.alias,
        health_check_id=record_in.health_check_id
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def update_record(db: Session, db_record: DNSRecord, record_in: DNSRecordUpdate) -> DNSRecord:
    # Validate value using DNSRecordBase validator if value is changed
    if record_in.value is not None:
        # Create a temp object to run model validators
        try:
            DNSRecordBase(
                name=db_record.name,
                type=db_record.type,
                ttl=record_in.ttl if record_in.ttl is not None else db_record.ttl,
                value=record_in.value,
                routing_policy=record_in.routing_policy if record_in.routing_policy is not None else db_record.routing_policy,
                alias=record_in.alias if record_in.alias is not None else db_record.alias,
                health_check_id=record_in.health_check_id if record_in.health_check_id is not None else db_record.health_check_id
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    update_data = record_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_record, field, value)
        
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_record(db: Session, db_record: DNSRecord):
    # Restrict deletion of default NS/SOA records
    # If the record is NS or SOA and name equals zone.name + "."
    zone = db.query(HostedZone).filter(HostedZone.id == db_record.hosted_zone_id).first()
    zone_dot_name = f"{zone.name}." if not zone.name.endswith(".") else zone.name
    
    if db_record.type in ["NS", "SOA"] and db_record.name.lower() == zone_dot_name.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Deletion of default {db_record.type} records for the hosted zone is restricted."
        )

    db.delete(db_record)
    db.commit()
