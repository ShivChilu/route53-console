from pydantic import BaseModel, field_validator, model_validator, Field
from typing import List, Optional
from datetime import datetime
import re
import ipaddress

VALID_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]

class DNSRecordBase(BaseModel):
    name: str # e.g. "www" or "example.com."
    type: str
    ttl: int = Field(300, ge=0)
    value: str # raw text, could be multi-line (newline-separated)
    routing_policy: str = "Simple"
    alias: bool = False
    health_check_id: Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in VALID_RECORD_TYPES:
            raise ValueError(f"Type must be one of {VALID_RECORD_TYPES}")
        return v

    @model_validator(mode="after")
    def validate_record_value(self) -> "DNSRecordBase":
        rec_type = self.type.upper()
        raw_val = self.value.strip()
        lines = [line.strip() for line in raw_val.split("\n") if line.strip()]

        if not lines:
            raise ValueError("Value field cannot be empty.")

        # Validate each line depending on type
        for line in lines:
            if rec_type == "A":
                # Validate IPv4
                try:
                    ipaddress.IPv4Address(line)
                except ValueError:
                    raise ValueError(f"Value '{line}' is not a valid IPv4 address.")
            
            elif rec_type == "AAAA":
                # Validate IPv6
                try:
                    ipaddress.IPv6Address(line)
                except ValueError:
                    raise ValueError(f"Value '{line}' is not a valid IPv6 address.")
            
            elif rec_type == "CNAME" or rec_type == "NS" or rec_type == "PTR":
                # Validate hostname format
                # simple domain regex
                pattern = r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}\.?$"
                if not re.match(pattern, line):
                    raise ValueError(f"Value '{line}' must be a valid domain/hostname.")
            
            elif rec_type == "MX":
                # e.g., "10 mail.example.com"
                parts = line.split()
                if len(parts) != 2:
                    raise ValueError(f"MX record must be in format 'priority hostname', got: '{line}'")
                priority, host = parts
                if not priority.isdigit():
                    raise ValueError(f"MX priority must be an integer, got '{priority}'")
                pattern = r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}\.?$"
                if not re.match(pattern, host):
                    raise ValueError(f"MX target '{host}' must be a valid domain/hostname.")
            
            elif rec_type == "SRV":
                # e.g., "10 5 5060 sip.example.com"
                parts = line.split()
                if len(parts) != 4:
                    raise ValueError(f"SRV record must be in format 'priority weight port target', got: '{line}'")
                pri, wei, por, tar = parts
                if not (pri.isdigit() and wei.isdigit() and por.isdigit()):
                    raise ValueError(f"SRV priority, weight, and port must be positive integers.")
                pattern = r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}\.?$"
                if not re.match(pattern, tar):
                    raise ValueError(f"SRV target '{tar}' must be a valid domain/hostname.")
            
            elif rec_type == "CAA":
                # e.g., "0 issue \"letsencrypt.org\""
                # format: flags tag value
                parts = line.split(maxsplit=2)
                if len(parts) != 3:
                    raise ValueError(f"CAA record must be in format 'flags tag \"value\"', got: '{line}'")
                flags, tag, val = parts
                if not flags.isdigit():
                    raise ValueError(f"CAA flags must be an integer, got '{flags}'")
                if tag not in ["issue", "issuewild", "iodef"]:
                    raise ValueError(f"CAA tag must be 'issue', 'issuewild', or 'iodef', got '{tag}'")
                # value is usually quoted
                if not (val.startswith('"') and val.endswith('"')):
                    raise ValueError(f"CAA value must be enclosed in double quotes, got {val}")
            
            elif rec_type == "SOA":
                # e.g., "ns-2048.awsdns-64.net. hostmaster.example.com. 1 7200 900 1209600 86400"
                parts = line.split()
                if len(parts) != 7:
                    raise ValueError(f"SOA record must have 7 fields (mname rname serial refresh retry expire minimum), got: '{line}'")
                mname, rname, serial, refresh, retry, expire, minimum = parts
                # Verify trailing dots/valid names is standard, we'll verify fields 3-7 are integers
                for name, val in [("serial", serial), ("refresh", refresh), ("retry", retry), ("expire", expire), ("minimum", minimum)]:
                    if not val.isdigit():
                        raise ValueError(f"SOA field {name} must be an integer, got '{val}'")
            
            elif rec_type == "TXT":
                # TXT accepts any text, optional double quotes.
                pass

        return self

class DNSRecordCreate(DNSRecordBase):
    pass

class DNSRecordUpdate(BaseModel):
    ttl: Optional[int] = Field(None, ge=0)
    value: Optional[str] = None
    routing_policy: Optional[str] = None
    alias: Optional[bool] = None
    health_check_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def validate_update_fields(cls, data):
        # We need the record type to validate 'value', but since update doesn't allow changing type,
        # we will handle type-specific value validation in the Service/Router layer where we fetch the existing record type,
        # or we just allow validation in the router when value is modified. We will implement that in the router/service.
        return data

class DNSRecordResponse(BaseModel):
    id: int
    hosted_zone_id: int
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    alias: bool
    health_check_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DNSRecordPagination(BaseModel):
    items: List[DNSRecordResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
