from sqlalchemy.orm import Session
from sqlalchemy import or_
import random
import string
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate

def generate_zone_id() -> str:
    # 16-character alphanumeric uppercase starting with Z
    chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=15))
    return f"Z{chars}"

def create_hosted_zone(db: Session, zone_in: HostedZoneCreate, user_id: int) -> HostedZone:
    zone_id = generate_zone_id()
    
    # 1. Create Hosted Zone
    db_zone = HostedZone(
        user_id=user_id,
        zone_id=zone_id,
        name=zone_in.name,
        type=zone_in.type,
        description=zone_in.description,
        private_zone=zone_in.private_zone
    )
    db.add(db_zone)
    db.flush() # Populate db_zone.id for foreign key reference

    # 2. Add default NS & SOA records
    ns_servers = [
        f"ns-{random.randint(100, 2048)}.awsdns-{random.randint(10, 99)}.net.",
        f"ns-{random.randint(100, 2048)}.awsdns-{random.randint(10, 99)}.org.",
        f"ns-{random.randint(100, 2048)}.awsdns-{random.randint(10, 99)}.com.",
        f"ns-{random.randint(100, 2048)}.awsdns-{random.randint(10, 99)}.co.uk."
    ]
    
    # NS Record
    ns_record = DNSRecord(
        hosted_zone_id=db_zone.id,
        name=f"{db_zone.name}.",
        type="NS",
        ttl=172800,
        value="\n".join(ns_servers),
        routing_policy="Simple",
        alias=False
    )
    db.add(ns_record)

    # SOA Record
    soa_val = f"{ns_servers[0]} awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    soa_record = DNSRecord(
        hosted_zone_id=db_zone.id,
        name=f"{db_zone.name}.",
        type="SOA",
        ttl=900,
        value=soa_val,
        routing_policy="Simple",
        alias=False
    )
    db.add(soa_record)
    
    db.commit()
    db.refresh(db_zone)
    return db_zone

def get_hosted_zones(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str = None,
    zone_type: str = None
):
    query = db.query(HostedZone).filter(HostedZone.user_id == user_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                HostedZone.name.ilike(search_term),
                HostedZone.zone_id.ilike(search_term),
                HostedZone.description.ilike(search_term)
            )
        )

    if zone_type:
        query = query.filter(HostedZone.type == zone_type.lower())

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(HostedZone.created_at.desc()).offset(offset).limit(page_size).all()
    
    total_pages = max(1, (total + page_size - 1) // page_size)

    # Attach record count to items dynamically or we can do it via property/relation query.
    # In schemas we serialize HostedZoneResponse. To do this efficiently, we can fetch record counts.
    # Let's populate record_count for schemas.
    for item in items:
        item.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == item.id).count()

    return items, total, total_pages

def get_hosted_zone_by_id(db: Session, zone_id: str, user_id: int) -> HostedZone:
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id, HostedZone.user_id == user_id).first()
    if zone:
        zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    return zone

def update_hosted_zone(db: Session, db_zone: HostedZone, zone_in: HostedZoneUpdate) -> HostedZone:
    update_data = zone_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_zone, field, value)
    db.commit()
    db.refresh(db_zone)
    db_zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == db_zone.id).count()
    return db_zone

def delete_hosted_zone(db: Session, db_zone: HostedZone):
    db.delete(db_zone)
    db.commit()
