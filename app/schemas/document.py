from pydantic import BaseModel
from typing import Optional


class DocumentBase(BaseModel):
    filename: str
    file_size: int


class DocumentCreate(DocumentBase):
    owner_id: int


class DocumentResponse(DocumentBase):
    id: int
    status: str

    class Config:
        from_attributes = True