from fastapi import HTTPException, Request
import traceback
import logging
from contextvars import ContextVar
from uuid import uuid4

from fastapi.exceptions import RequestValidationError
from functools import wraps
from typing import List, Callable, Literal, cast, Optional
from starlette.responses import JSONResponse

from app.common.errors import UserErrors, ClientErrors, DatabaseErrors
from app.utils.request_data_extractor import RequestDataExtractor
from app.core.conf import APP_NAME, ENVIRONMENT
from app.common.error_manager import ErrorMessageManager

# Setup logging
logger = logging.getLogger(__name__)

# Context variable for request ID
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

def get_current_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_var.get()

def create_request_id() -> str:
    """Create and set a new request ID."""
    req_id = str(uuid4())
    request_id_var.set(req_id)
    return req_id

LOG_LEVELS = {
    'ERROR': logger.error,
    'CRITICAL': logger.critical,
    'INFO': logger.info,
    'WARNING': logger.warning
}


class ExceptionHandler:

    def __init__(
        self, 
        request: Request,
        exc: Exception
    ):
        self.request = request
        self.request_data_extractor = RequestDataExtractor(request)
        self.exc = exc

    async def _publish_error_message(self, error_data: dict):
        """Publish error message using ErrorMessageManager."""
        error_message_manager = ErrorMessageManager(
            product=APP_NAME,
            module=APP_NAME,
            log_level="critical",
            token_data=error_data.get('token_data', {}),
            uri=error_data.get('uri', 'unknown-uri'),
            error=error_data.get('err', 'Unhandled error'),
            traceback=error_data.get('traceback', ''),
            error_type=error_data.get('error_type', 'UnknownError'),
            request_data=error_data.get('request_data', {}),
            headers=error_data.get('headers', {}),
            method=error_data.get('method', 'unknown'),
            exclude=[],
            additional_info={}
        )
        error_message_manager.set_channel('logger')
        error_message_manager.set_log_level('error')
        await error_message_manager.publish_error_message()

    async def handle_exception(self):
        if isinstance(self.exc, HTTPException):
            return await self.http_exception_handler()
        
        elif isinstance(self.exc, RequestValidationError):
            return await self.validation_error_handler()
        
        elif isinstance(self.exc, DatabaseErrors):
            return await self.database_error_handler()
        
        elif isinstance(self.exc, UserErrors):
            return await self.user_error_handler()

        elif isinstance(self.exc, ClientErrors):
            return await self.client_error_handler()
        return await self.unknown_error_handler()
    
    def log_error(self):
        try:
            log_message = (
                f'{self.request_data_extractor.get_request_method()} : '
                f'{self.request_data_extractor.get_request_url()} : '
                f'{str(self.exc)}'
            )
            
            # Safely format traceback
            try:
                if self.exc.__traceback__:
                    log_message += f'\n{"".join(traceback.format_exception(type(self.exc), value=self.exc, tb=self.exc.__traceback__))}'
            except Exception:
                log_message += f'\n[Traceback formatting failed]'
            
            if not isinstance(self.exc, UserErrors):
                logger.error(log_message)
                return
            
            log_level = getattr(self.exc, 'log_level', 'ERROR')
            LOG_LEVELS.get(log_level, logger.error)(log_message)
        except Exception as e:
            # If logging fails, just log a simple message
            logger.error(f"Failed to log error: {str(e)}, Original: {str(self.exc)}")

    async def prepare_error_data(self, exclude_fields: List[str] = []):
        error_data = {
            "log_level": getattr(self.exc, 'log_level', 'ERROR') if isinstance(self.exc, UserErrors) else 'ERROR', 
            'error_id': get_current_request_id() or 'unknown'
        }

        try:
            if "project" not in exclude_fields:
                error_data['project'] = APP_NAME

            if "module" not in exclude_fields:
                error_data['module'] = APP_NAME
            
            if "method" not in exclude_fields:
                try:
                    error_data['method'] = self.request_data_extractor.get_request_method()
                except Exception:
                    error_data['method'] = 'UNKNOWN'
            
            if "headers" not in exclude_fields:
                try:
                    error_data['headers'] = self.request_data_extractor.get_request_headers()
                except Exception:
                    error_data['headers'] = {}

            if 'uri' not in exclude_fields:
                try:
                    error_data['uri'] = self.request_data_extractor.get_request_url(include_query_params=True)
                except Exception:
                    error_data['uri'] = 'UNKNOWN'
            
            if 'err' not in exclude_fields:
                error_data['err'] = str(self.exc)
            
            if "request_data" not in exclude_fields:
                try:
                    error_data['request_data'] = await self.request_data_extractor.get_request_body()
                except Exception:
                    error_data['request_data'] = {}
            
            if "traceback" not in exclude_fields:
                try:
                    error_data['traceback'] = ''.join(traceback.format_tb(self.exc.__traceback__)) if self.exc.__traceback__ else ''
                except Exception:
                    error_data['traceback'] = ''
            
            if "error_type" not in exclude_fields:
                if isinstance(self.exc, UserErrors):
                    error_data['error_type'] = getattr(self.exc, 'type', type(self.exc).__name__)
                else:
                    error_data['error_type'] = type(self.exc).__name__
        except Exception as e:
            logger.error(f"Error in prepare_error_data: {str(e)}", exc_info=True)
            # Return minimal error data if preparation fails
            error_data['err'] = str(self.exc)
            error_data['error_type'] = type(self.exc).__name__

        return error_data
        
    async def validation_error_handler(self):
        reformatted_message = {'message': "Invalid Request", 'type': 'InvalidDataError'}
        self.exc: RequestValidationError
        error_message = "Invalid Request"

        for pydantic_error in self.exc.errors():
            loc, msg = pydantic_error["loc"], pydantic_error["msg"]
            filtered_loc = loc[1:] if loc[0] in ("body", "query", "path") else loc
            filtered_loc = (str(i) for i in filtered_loc)
            field_string = ".".join(filtered_loc)
            error_message = field_string.title().replace('_', ' ') + ': ' + msg.title()
            reformatted_message.setdefault(field_string, []).append(msg)

        return JSONResponse(
            status_code=400,
            content={"message": error_message, "details": reformatted_message, 'success': False},
        )
    
    async def database_error_handler(self):
        self.exc: DatabaseErrors
        
        try:
            # Get error attributes safely
            error_type = getattr(self.exc, 'type', type(self.exc).__name__)
            error_message = getattr(self.exc, 'message', str(self.exc))
            response_code = getattr(self.exc, 'response_code', 500)
            
            # Return response immediately
            response = JSONResponse(
                content={
                    'details': {
                        'type': error_type,
                        'message': error_message
                    },
                    'message': error_message,
                    'success': False
                },
                status_code=response_code
            )
            
            # Log error synchronously (non-blocking)
            try:
                self.log_error()
            except Exception as log_error:
                logger.warning(f"Failed to log database error: {str(log_error)}")
            
            return response
        except Exception as e:
            logger.error(f"Error in database_error_handler: {str(e)}", exc_info=True)
            return JSONResponse(
                content={
                    'details': {
                        'type': 'DatabaseError',
                        'message': 'Database operation failed'
                    },
                    'message': str(self.exc),
                    'success': False
                },
                status_code=getattr(self.exc, 'response_code', 500)
            )
    
    async def http_exception_handler(self):
        return JSONResponse(
            content={
                'details': {
                    'type': type(self.exc).__name__,
                    'message': self.exc.detail
                },
                'message': self.exc.detail,
                'success': False
            },
            status_code=self.exc.status_code,
            headers=self.exc.headers if hasattr(self.exc, 'headers') else None
        )

    async def user_error_handler(self):
        self.exc: UserErrors
        
        try:
            # Safely get error attributes with fallbacks - do this FIRST
            error_type = getattr(self.exc, 'type', type(self.exc).__name__)
            error_message = getattr(self.exc, 'message', str(self.exc))
            response_code = getattr(self.exc, 'response_code', 400)
            response_data = getattr(self.exc, 'data', {})
            
            # Return response immediately - don't wait for logging/preparation
            # Logging will happen after response is sent
            response = JSONResponse(
                content={
                    'details': {
                        'type': error_type,
                        'message': error_message
                    },
                    'message': error_message,
                    'data': response_data,
                    'success': False
                },
                status_code=response_code
            )
            
            # Log error synchronously (quick operation, no request body reading)
            try:
                self.log_error()
            except Exception as log_error:
                logger.warning(f"Failed to log error: {str(log_error)}")
            
            return response
            
        except Exception as e:
            # If error handler itself fails, log and return generic error
            logger.error(f"Error in user_error_handler: {str(e)}", exc_info=True)
            
            # Try to at least return the right status code
            response_code = getattr(self.exc, 'response_code', 500) if hasattr(self.exc, 'response_code') else 500
            error_message = getattr(self.exc, 'message', str(self.exc)) if hasattr(self.exc, 'message') else str(self.exc)
            
            return JSONResponse(
                content={
                    'details': {
                        'type': 'ErrorHandlerException',
                        'message': 'An error occurred while processing the error'
                    },
                    'message': error_message,
                    'success': False
                },
                status_code=response_code
            )

    async def client_error_handler(self):
        self.exc: ClientErrors
        
        try:
            # Get error attributes safely
            error_message = getattr(self.exc, 'message', str(self.exc))
            response_code = getattr(self.exc, 'response_code', 400)
            
            # Return response immediately
            response = JSONResponse(
                content={
                    'message': error_message,
                    'success': False
                },
                status_code=response_code
            )
            
            # Log error synchronously (non-blocking)
            try:
                self.log_error()
            except Exception as log_error:
                logger.warning(f"Failed to log client error: {str(log_error)}")
            
            return response
        except Exception as e:
            logger.error(f"Error in client_error_handler: {str(e)}", exc_info=True)
            return JSONResponse(
                content={
                    'message': str(self.exc),
                    'success': False
                },
                status_code=getattr(self.exc, 'response_code', 400)
            )

    async def unknown_error_handler(self):
        try:
            # Return response immediately
            response = JSONResponse(
                content={
                    'details': {
                        'type': 'Internal Server Error',
                        'message': 'Internal Server Error'
                    },
                    'message': 'Internal Server Error', 
                    'success': False
                },
                status_code=500
            )
            
            # Try to log and publish error message in background (non-blocking)
            try:
                self.log_error()
                # Try to prepare error data without request body to avoid hanging
                try:
                    data = await self.prepare_error_data(exclude_fields=["request_data"])
                    await self._publish_error_message(data)
                except Exception as prep_error:
                    logger.warning(f"Failed to prepare/publish error message: {str(prep_error)}")
            except Exception as log_error:
                logger.warning(f"Failed to log unknown error: {str(log_error)}")
            
            return response
        except Exception as e:
            # If even the error handler fails, return minimal response
            logger.error(f"Critical error in unknown_error_handler: {str(e)}", exc_info=True)
            return JSONResponse(
                content={
                    'details': {
                        'type': 'Internal Server Error',
                        'message': 'An unexpected error occurred'
                    },
                    'message': 'Internal Server Error',
                    'success': False
                },
                status_code=500
            )


# FastAPI exception handler functions
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for FastAPI."""
    # Log that we're handling the exception
    logger.info(f"Global exception handler called for: {type(exc).__name__}")
    
    try:
        handler = ExceptionHandler(request, exc)
        result = await handler.handle_exception()
        logger.info(f"Exception handler completed successfully for: {type(exc).__name__}")
        return result
    except Exception as handler_error:
        # If exception handler itself fails, log and return generic error
        logger.error(f"Exception handler failed: {str(handler_error)}", exc_info=True)
        logger.error(f"Original exception: {str(exc)}", exc_info=True)
        
        # Try to get response code from original exception if it's a UserErrors
        if isinstance(exc, UserErrors):
            response_code = getattr(exc, 'response_code', 500)
            error_message = getattr(exc, 'message', str(exc))
            error_type = getattr(exc, 'type', type(exc).__name__)
        else:
            response_code = 500
            error_message = str(exc) if exc else 'Unknown error'
            error_type = type(exc).__name__
        
        return JSONResponse(
            content={
                'details': {
                    'type': error_type,
                    'message': error_message
                },
                'message': error_message,
                'success': False
            },
            status_code=response_code
        )


async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler for HTTPException."""
    handler = ExceptionHandler(request, exc)
    return await handler.http_exception_handler()


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler for RequestValidationError."""
    handler = ExceptionHandler(request, exc)
    return await handler.validation_error_handler()


default_logger_format = 'Error occurred after request in function: {funcname} with args: {args} and kwargs: {kwargs}'

def after_request_exception_handler(
    logger_format: str = default_logger_format,
    db_connection_type: Literal['read', 'write'] = 'write'
):
    """
    Decorator for handling exceptions after request processing.
    Formatter gives following keyword arguments: 
    funcname, args, kwargs
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                create_request_id()
                return await func(*args, **kwargs)
        
            except UserErrors as exc:
                logger.error(
                    logger_format.format(
                        funcname=f'{func.__code__.co_filename}:{func.__name__}', 
                        args=args, 
                        kwargs=kwargs
                    ), 
                    exc_info=True
                )
                error_data = {
                    "log_level": exc.log_level,
                    'user_id': kwargs.get('user_id'),
                    'project': APP_NAME,
                    'module': APP_NAME,
                    'error_id': get_current_request_id(),
                    'uri': 'AfterRequest',
                    'err': str(exc),
                    'request_data': {
                        'args': str(args),
                        'kwargs': str(kwargs)
                    },
                    'traceback': f'\n{"".join(traceback.format_exception(type(exc), value=exc, tb=exc.__traceback__))}',
                    'error_type': exc.type
                }
                raise  # Re-raise to let FastAPI handle it
    
            except Exception as exc:
                logger.error(
                    logger_format.format(
                        funcname=f'{func.__code__.co_filename}:{func.__name__}', 
                        args=args, 
                        kwargs=kwargs
                    ), 
                    exc_info=True
                )
                error_data = {
                    "log_level": 'ERROR',
                    'user_id': kwargs.get('user_id'),
                    'project': APP_NAME,
                    'module': APP_NAME,
                    'error_id': get_current_request_id(),
                    'uri': 'AfterRequest',
                    'err': str(exc),
                    'request_data': {
                        'args': str(args),
                        'kwargs': str(kwargs)
                    },
                    'traceback': f'\n{"".join(traceback.format_exception(type(exc), value=exc, tb=exc.__traceback__))}',
                    'error_type': type(exc).__name__
                }
                error_message_manager = ErrorMessageManager(
                    product=APP_NAME,
                    module=APP_NAME,
                    log_level="critical",
                    token_data=error_data.get('token_data', {}),
                    uri=error_data.get('uri', 'unknown-uri'),
                    error=error_data.get('err', 'Unhandled error'),
                    traceback=error_data.get('traceback', ''),
                    error_type=error_data.get('error_type', 'UnknownError'),
                    request_data=error_data.get('request_data', {}),
                    headers=error_data.get('headers', {}),
                    method=error_data.get('method', 'unknown'),
                    exclude=[],
                    additional_info={}
                )
                error_message_manager.set_channel('logger')
                error_message_manager.set_log_level('error')
                await error_message_manager.publish_error_message()
                raise  # Re-raise to let FastAPI handle it
          
        return cast(Callable, wrapper)
    
    return decorator
