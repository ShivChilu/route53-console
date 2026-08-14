from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.services.auth_service import get_password_hash
from app.services.hosted_zone_service import create_hosted_zone
from app.services.record_service import create_record
from app.schemas.hosted_zone import HostedZoneCreate
from app.schemas.dns_record import DNSRecordCreate

def seed():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if user already exists
        admin_email = "admin@example.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print("Seeding admin user...")
            admin = User(
                email=admin_email,
                name="Route53 Admin",
                password_hash=get_password_hash("admin123")
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("Admin user seeded.")
        
        # Check if zones exist, if not seed them
        zones_count = db.query(HostedZone).filter(HostedZone.user_id == admin.id).count()
        if zones_count == 0:
            print("Seeding demo hosted zones and DNS records...")
            
            # Zone 1: example.com (Public)
            hz1 = create_hosted_zone(
                db,
                HostedZoneCreate(
                    name="example.com",
                    description="Main production domain for external web traffic",
                    type="public",
                    private_zone=False
                ),
                admin.id
            )
            # Add records for example.com
            create_record(db, hz1, DNSRecordCreate(name="www", type="A", ttl=300, value="192.168.1.100"))
            create_record(db, hz1, DNSRecordCreate(name="api", type="A", ttl=60, value="192.168.1.101"))
            create_record(db, hz1, DNSRecordCreate(name="blog", type="CNAME", ttl=3600, value="wordpress.vip.com."))
            create_record(db, hz1, DNSRecordCreate(name="@", type="TXT", ttl=3600, value='"v=spf1 include:_spf.google.com ~all"'))
            create_record(db, hz1, DNSRecordCreate(name="mail", type="MX", ttl=300, value="10 mailserver.example.com"))

            # Zone 2: mycompany.com (Public)
            hz2 = create_hosted_zone(
                db,
                HostedZoneCreate(
                    name="mycompany.com",
                    description="Corporate static site and blogs",
                    type="public",
                    private_zone=False
                ),
                admin.id
            )
            create_record(db, hz2, DNSRecordCreate(name="www", type="A", ttl=300, value="104.24.12.180"))
            create_record(db, hz2, DNSRecordCreate(name="m", type="A", ttl=300, value="104.24.12.181"))

            # Zone 3: demo.internal (Private)
            hz3 = create_hosted_zone(
                db,
                HostedZoneCreate(
                    name="demo.internal",
                    description="Internal development VPC environment lookup service",
                    type="private",
                    private_zone=True
                ),
                admin.id
            )
            create_record(db, hz3, DNSRecordCreate(name="db.rds", type="A", ttl=60, value="10.0.1.45"))
            create_record(db, hz3, DNSRecordCreate(name="cache.redis", type="A", ttl=60, value="10.0.1.46"))
            create_record(db, hz3, DNSRecordCreate(name="auth", type="A", ttl=300, value="10.0.2.12"))
            
            print("Demo data seeded successfully.")
        else:
            print("Database already contains data, skipping seed.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
