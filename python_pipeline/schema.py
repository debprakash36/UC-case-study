"""
Schema definitions for AI-driven feedback classification.
Uses Pydantic to structure output for:
- sentiment
- service_category
- pain_point
- summary
- opportunity_theme
- workaround_mentioned
- consumer_growth_controllable
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class SentimentEnum(str, Enum):
    POSITIVE = "Positive"
    NEGATIVE = "Negative"
    NEUTRAL = "Neutral"


class ServiceCategoryEnum(str, Enum):
    CLEANING = "Cleaning & Pest Control"
    SALON_SPA = "Salon & Spa at Home"
    AC_APPLIANCE = "AC & Appliance Repair"
    PLUMBING_ELECTRICAL = "Plumbing, Electrician & Carpentry"
    PAINTING = "Painting & Renovation"
    CUSTOMER_SUPPORT = "Customer Support & Policies"
    APP_PLATFORM = "App & Platform Experience"
    OTHER = "Other / General Home Service"


class OpportunityThemeEnum(str, Enum):
    OFFLINE_FALLBACK = "Offline / Local Habit Fallback"
    MAINTENANCE_REMINDER = "Post-Service Maintenance & Reminder Gap"
    CROSS_CATEGORY = "Cross-Category Discovery Gap"
    TRUST_ANXIETY = "Trust & Predictability Anxiety"
    BOOKING_FRICTION = "App & Booking Friction"
    SERVICE_QUALITY = "Service Quality / Partner Ops (Out of Scope)"
    PRICING = "Pricing & Hidden Charges (Out of Scope)"
    POSITIVE = "Positive / No Clear Friction"


class WorkaroundEnum(str, Enum):
    LOCAL_TECHNICIAN = "Local Technician"
    COMPETITOR_APP = "Competitor App"
    MAID_NEIGHBOUR_WHATSAPP = "Maid / Neighbour / WhatsApp"
    DIY = "DIY"
    NONE = "None"


class FeedbackClassification(BaseModel):
    sentiment: SentimentEnum = Field(
        description="Overall customer sentiment: Positive, Negative, or Neutral"
    )
    service_category: ServiceCategoryEnum = Field(
        description="Primary service category mentioned or inferred from the review"
    )
    pain_point: str = Field(
        description="Core customer pain point or friction area"
    )
    summary: str = Field(
        description="Crisp 1-sentence analytical summary capturing the core feedback and customer insight"
    )
    opportunity_theme: OpportunityThemeEnum = Field(
        description="90-day repeat-booking opportunity theme or out-of-scope friction"
    )
    workaround_mentioned: WorkaroundEnum = Field(
        description="Alternative workaround used or mentioned by customer"
    )
    consumer_growth_controllable: bool = Field(
        description="True ONLY if solvable from customer product side without discounts, pricing changes, or partner management ops changes"
    )


class BatchClassificationItem(BaseModel):
    id: str = Field(description="Record ID matching the input record")
    sentiment: SentimentEnum = Field(description="Overall sentiment")
    service_category: ServiceCategoryEnum = Field(description="Primary service category")
    pain_point: str = Field(description="Core customer pain point")
    summary: str = Field(description="1-sentence analytical summary")
    opportunity_theme: OpportunityThemeEnum = Field(description="Repeat-booking opportunity theme")
    workaround_mentioned: WorkaroundEnum = Field(description="Workaround mentioned")
    consumer_growth_controllable: bool = Field(description="True if controllable by consumer product")


class BatchClassificationResponse(BaseModel):
    results: List[BatchClassificationItem] = Field(description="List of classified feedback items matching input IDs")
