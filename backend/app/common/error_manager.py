from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from uuid import uuid4
from datetime import datetime

from app.core.conf import ENVIRONMENT
from app.common.logging import Logger
from app.common.email_template import send_error_notification_email


@dataclass
class MailManager:
    product: str
    module: str
    log_level: str
    uri: str
    error: str
    traceback: str
    error_type: str
    token_data: Optional[Dict[str, str]] = field(default_factory=dict)
    request_data: Optional[Dict[str, Any]] = field(default_factory=dict)
    headers: Optional[Dict[str, str]] = field(default_factory=dict)
    method: str = 'unknown'
    additional_info: Optional[Dict] = field(default_factory=dict)
    channel: str = 'logger'
    sender: str = 'noreply'
    environment: str = ENVIRONMENT.lower()
    to: List[str] = field(default_factory=list)
    exclude: List[str] = field(default_factory=list)
    LOG_LEVELS = {"info", "warning", "error", "critical"}  
    valid_channels = {'logger', 'mail'}

    def set_channel(self, channel: str):
        if channel.lower() in self.valid_channels:
            self.channel  = channel.lower()
        else:
            raise ValueError(f'Invalid channel: {channel}. Choose from {self.valid_channels}')
    def set_log_level(self, level: str):
        """
        Set the log level if it is valid.
        """
        if level.lower() in self.LOG_LEVELS:
            self.log_level = level.lower()
        else:
            raise ValueError(f"Invalid log level: {level}. Choose from {self.LOG_LEVELS}")
        

    def prepare_message(self) -> Dict:
        """
        Prepare the error message as a structured dictionary.
        """
        pass
    
    async def publish_error_message(self):
        """
        Publish the error message to the Redis 'error' channel.
        """
        pass
        
        

@dataclass
class ErrorMessageManager(MailManager):
    channel: str = 'logger'
        
    
    def prepare_message(self) -> Dict:
        """
        Prepare the error message as a structured dictionary.
        """
        message = {
            "id":str(uuid4()),
            "product": self.product,
            "module": self.module,
            "log_level": self.log_level,
            "uri": self.uri,
            "error": self.error,
            "traceback": self.traceback,
            "error_type": self.error_type,
            "token_data": self.token_data,
            "sender": self.sender,
            "request_data": self.request_data,
            "headers": self.headers,
            "environment": self.environment,
            "method": self.method,
            "to": self.to,
            "exclude": self.exclude,
            "additional_info": self.additional_info
        }
        
        # Extract status_code from additional_info if present
        if self.additional_info and 'status_code' in self.additional_info:
            message['status_code'] = self.additional_info.get('status_code')
        
        return message
    
    async def publish_error_message(self):
        """Publish the error message to the logger and/or email."""
        message = self.prepare_message()
        message['timestamp'] = datetime.now().isoformat()
        
        self._log_error(message)
        
        if self._should_send_email():
            send_error_notification_email(message)
    
    def _log_error(self, message: dict):
        """Log the error with appropriate log level."""
        log_extra = self._prepare_log_extra(message)
        log_level = self.log_level.upper()
        log_message = f"Error: {message.get('error', 'Unknown error')} | Type: {message.get('error_type', 'Unknown')} | URI: {message.get('uri', 'unknown')}"
        
        log_methods = {
            'CRITICAL': Logger.critical,
            'ERROR': Logger.error,
            'WARNING': Logger.warning,
            'INFO': Logger.info
        }
        log_methods.get(log_level, Logger.error)(log_message, extra=log_extra)
    
    def _prepare_log_extra(self, message: dict) -> dict:
        """Prepare log extra dict, avoiding reserved LogRecord fields."""
        log_extra = {k: v for k, v in message.items() if k != 'module'}
        log_extra['error_module'] = message.get('module', 'unknown')
        return log_extra
    
    def _should_send_email(self) -> bool:
        """Check if email should be sent based on channel and log level."""
        log_level = self.log_level.upper()
        should_send = self.channel == 'mail' and log_level in ['ERROR', 'CRITICAL']
        
        if not should_send:
            Logger.warning(f"Email not sent - channel: {self.channel}, log_level: {log_level} (required: ERROR or CRITICAL)")
        
        return should_send  