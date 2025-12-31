from app.core.celery_app import celery_app
from app.services.email_service import send_email



@celery_app.task(name="send_email_task",max_retries=5)
def send_email_task(subject:str,body:str,to_email:list[str]):
    return send_email(subject,body,to_email)