from pydantic import BaseModel, field_validator, ValidationInfo
from typing import List, Optional
from datetime import datetime
import re

class HostedZoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "public" # public or private
    private_zone: bool = False

    @field_validator("name")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        # Check standard domain validation (regex check or simple check)
        v = v.strip().lower()
        if v.endswith("."):
            v = v[:-1]
        
        # Simple domain name regex supporting private TLDs like .internal (up to 12 chars)
        pattern = r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,12}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid domain name format. Must be a valid domain e.g., example.com")
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ["public", "private"]:
            raise ValueError("Type must be either 'public' or 'private'")
        return v

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    description: Optional[str] = None
    private_zone: Optional[bool] = None

class HostedZoneResponse(BaseModel):
    id: int
    zone_id: str
    name: str
    type: str
    description: Optional[str]
    private_zone: bool
    record_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HostedZonePagination(BaseModel):
    items: List[HostedZoneResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
