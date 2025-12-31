import smtplib
from email.message import EmailMessage
from app.core.conf import EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD

# class EmailService:
#     def __init__(self, email_host: str, email_port: int, email_host_user: str, email_host_password: str):
#         self.email_host = email_host
#         self.email_port = email_port
#         self.email_host_user = email_host_user
#         self.email_host_password = email_host_password

#     def send_email(self, subject:str,body:str)

def send_email(subject:str,body:str,to_email:list[str]):
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_HOST_USER
    msg["To"] = ", ".join(to_email)
    msg.add_alternative(body, subtype="html")

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.send_message(msg)
    return "Email sent successfully"