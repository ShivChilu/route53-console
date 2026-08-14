from app.schemas.auth import LoginRequest, UserResponse
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate, HostedZoneResponse, HostedZonePagination
from app.schemas.dns_record import DNSRecordCreate, DNSRecordUpdate, DNSRecordResponse, DNSRecordPagination

__all__ = [
    "LoginRequest",
    "UserResponse",
    "HostedZoneCreate",
    "HostedZoneUpdate",
    "HostedZoneResponse",
    "HostedZonePagination",
    "DNSRecordCreate",
    "DNSRecordUpdate",
    "DNSRecordResponse",
    "DNSRecordPagination"
]
