"""
Unified Feedback Data Model
Defines the standardized schema for feedback items collected across all sources.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class CustomerFeedback(BaseModel):
    id: str = Field(description="Unique record identifier")
    source: str = Field(description="Data source: playstore, reddit, youtube, trustpilot")
    author: Optional[str] = Field(default="Anonymous", description="Author display name or handle")
    title: Optional[str] = Field(default=None, description="Optional title or headline")
    text: str = Field(description="Core feedback text or comment")
    rating: Optional[float] = Field(default=None, description="Rating if available (e.g., 1-5 scale)")
    created_at: Optional[str] = Field(default=None, description="Timestamp of post/review creation in ISO format")
    url: Optional[str] = Field(default=None, description="Public URL to the review or comment")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Source-specific metadata (upvotes, likes, version, etc.)")
