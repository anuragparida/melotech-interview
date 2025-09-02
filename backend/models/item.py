"""
Pydantic models for MeloTech Backend
"""

from typing import Union
from pydantic import BaseModel


class Item(BaseModel):
    """Item model for API endpoints"""
    name: str
    price: float
    is_offer: Union[bool, None] = None
