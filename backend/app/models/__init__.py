# Import all models to register them with SQLAlchemy
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.customer import Customer, CustomerStatus, CustomerContact
from app.models.customer_note import CustomerNote
from app.models.customer_timeline import CustomerTimeline
from app.models.opportunity import Opportunity, OpportunityStage
from app.models.task import Task, TaskType, TaskPriority, TaskStatus
from app.models.email_activity import EmailActivity, EmailDirection, EmailStatus
from app.models.company_settings import CompanySettings

__all__ = [
    "User",
    "UserRole",
    "UserSession",
    "Lead",
    "LeadStatus",
    "LeadSource",
    "Customer",
    "CustomerStatus",
    "CustomerContact",
    "CustomerNote",
    "CustomerTimeline",
    "Opportunity",
    "OpportunityStage",
    "Task",
    "TaskType",
    "TaskPriority",
    "TaskStatus",
    "EmailActivity",
    "EmailDirection",
    "EmailStatus",
    "CompanySettings",
]