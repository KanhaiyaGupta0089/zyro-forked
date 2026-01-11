from fastapi import APIRouter, Request, Header, Depends
from app.core.conf import GITHUB_SECRET_KEY
from app.core.security import verify_github_signature
from app.common.errors import ClientErrors, ServerErrors, CredentialError
from app.db.connection import get_db
from app.services.github_webhook_service import GitHubWebhookService
from app.common.logging.logging_config import Logger
from sqlalchemy.ext.asyncio import AsyncSession

webhook_router = APIRouter()


@webhook_router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
    session: AsyncSession = Depends(get_db)
):
    """
    GitHub webhook endpoint
    Handles various GitHub events and integrates them with the project management system
    
    Supported events:
    - push: Tracks commits and code pushes
    - pull_request: Creates/updates issues from PRs
    - issues: Syncs GitHub issues with project issues
    - release: Tracks releases
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        
        # Verify the signature
        # GitHub sends signature as string, convert to bytes if needed
        if not x_hub_signature_256:
            Logger.warning("Missing GitHub webhook signature")
            raise CredentialError(message="Missing signature", response_code=401)
        
        signature_bytes = x_hub_signature_256.encode('utf-8') if isinstance(x_hub_signature_256, str) else x_hub_signature_256
        if not await verify_github_signature(body, GITHUB_SECRET_KEY, signature_bytes):
            Logger.warning("Invalid GitHub webhook signature")
            raise CredentialError(message="Invalid signature", response_code=401)
        
        # Parse payload
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event")
        delivery_id = request.headers.get("X-GitHub-Delivery")
        
        Logger.info(
            f"GitHub webhook received - Event: {event_type}, "
            f"Delivery ID: {delivery_id}"
        )
        
        # Process the webhook event
        result = await GitHubWebhookService.process_webhook_event(
            session=session,
            event_type=event_type,
            payload=payload
        )
        
        # Return response
        return {
            'status': 'success',
            'event_type': event_type,
            'delivery_id': delivery_id,
            'processing_result': result
        }
        
    except CredentialError:
        raise
    except Exception as e:
        Logger.error(f"Error processing GitHub webhook: {e}")
        raise ServerErrors(message=f"Error processing webhook: {str(e)}")
    
