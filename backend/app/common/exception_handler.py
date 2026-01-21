import traceback
from contextvars import ContextVar
from uuid import uuid4
from functools import wraps
from typing import List, Callable, Literal, cast, Optional

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

from app.common.errors import UserErrors, ClientErrors, DatabaseErrors
from app.utils.request_data_extractor import RequestDataExtractor
from app.core.conf import APP_NAME, ENVIRONMENT
from app.common.error_manager import ErrorMessageManager
from app.common.logging import Logger

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



class ExceptionHandler:

    def __init__(
        self, 
        request: Request,
        exc: Exception
    ):
        import sys
        print(f"ExceptionHandler.__init__ called with exception: {type(exc).__name__}", file=sys.stdout, flush=True)
        Logger.info(f"ExceptionHandler initialized - Exception: {type(exc).__name__} from {type(exc).__module__}")
        
        self.request = request
        self.request_data_extractor = RequestDataExtractor(request)
        self.exc = exc

    async def _publish_error_message(self, error_data: dict):
        """Publish error message using ErrorMessageManager."""
        from app.core.conf import ENABLE_ERROR_EMAILS
        
        error_type = error_data.get('error_type', 'UnknownError')
        log_level = self._determine_log_level(error_type)
        
        Logger.info(f"Publishing error message - Type: {error_type}, Log Level: {log_level}, ENABLE_ERROR_EMAILS: {ENABLE_ERROR_EMAILS}")
        
        # Include status_code in additional_info so it can be passed to email function
        additional_info = error_data.get('additional_info', {})
        if 'status_code' in error_data:
            additional_info['status_code'] = error_data.get('status_code')
        
        error_message_manager = ErrorMessageManager(
            product=APP_NAME,
            module=APP_NAME,
            log_level=log_level,
            token_data=error_data.get('token_data', {}),
            uri=error_data.get('uri', 'unknown-uri'),
            error=error_data.get('err', 'Unhandled error'),
            traceback=error_data.get('traceback', ''),
            error_type=error_type,
            request_data=error_data.get('request_data', {}),
            headers=error_data.get('headers', {}),
            method=error_data.get('method', 'unknown'),
            exclude=[],
            additional_info=additional_info,
            environment=ENVIRONMENT.lower()
        )
        
        channel = 'mail' if ENABLE_ERROR_EMAILS else 'logger'
        error_message_manager.set_channel(channel)
        error_message_manager.set_log_level(log_level)
        
        await error_message_manager.publish_error_message()
    
    def _determine_log_level(self, error_type: str) -> str:
        """Determine log level based on error type."""
        critical_errors = ['DatabaseErrors', 'ServerErrors', 'UnknownError']
        return 'critical' if error_type in critical_errors else 'error'

    async def handle_exception(self):
        error_type = type(self.exc).__name__
        error_module = type(self.exc).__module__
        Logger.info(f"Handling exception: {error_type} from {error_module}")
        
        # Check for SQLAlchemy database errors first
        if self._is_sqlalchemy_error(self.exc):
            Logger.info(f"Routing SQLAlchemy error to database_error_handler")
            return await self.database_error_handler()
        
        if isinstance(self.exc, HTTPException):
            return await self.http_exception_handler()
        
        elif isinstance(self.exc, RequestValidationError):
            return await self.validation_error_handler()
        
        elif isinstance(self.exc, DatabaseErrors):
            Logger.info(f"Routing DatabaseErrors to database_error_handler")
            return await self.database_error_handler()
        
        elif isinstance(self.exc, UserErrors):
            return await self.user_error_handler()

        elif isinstance(self.exc, ClientErrors):
            return await self.client_error_handler()
        
        Logger.info(f"Routing unknown error to unknown_error_handler")
        return await self.unknown_error_handler()
    
    def _is_sqlalchemy_error(self, exc: Exception) -> bool:
        """Check if exception is a SQLAlchemy database error."""
        error_type = type(exc).__name__
        error_module = type(exc).__module__
        
        # Check if it's a SQLAlchemy error
        if 'sqlalchemy' in error_module.lower():
            Logger.info(f"Detected SQLAlchemy error: {error_type} from module {error_module}")
            return True
        
        # Check for common SQLAlchemy error types
        sqlalchemy_errors = [
            'IntegrityError', 'OperationalError', 'ProgrammingError',
            'DataError', 'DatabaseError', 'InterfaceError', 'InternalError',
            'NotSupportedError', 'DisconnectionError'
        ]
        is_sqlalchemy = error_type in sqlalchemy_errors
        if is_sqlalchemy:
            Logger.info(f"Detected SQLAlchemy error type: {error_type}")
        return is_sqlalchemy
    
    def log_error(self):
        log_message = (
            f'{self.request_data_extractor.get_request_method()} : '
            f'{self.request_data_extractor.get_request_url()} : '
            f'{str(self.exc)}'
        )
        
        if self.exc.__traceback__:
            log_message += f'\n{"".join(traceback.format_exception(type(self.exc), value=self.exc, tb=self.exc.__traceback__))}'
        
        if not isinstance(self.exc, UserErrors):
            Logger.error(log_message)
            return
        
        log_level = getattr(self.exc, 'log_level', 'ERROR')
        LOG_LEVELS = {
            'ERROR': Logger.error,
            'CRITICAL': Logger.critical,
            'INFO': Logger.info,
            'WARNING': Logger.warning
        }
        LOG_LEVELS.get(log_level, Logger.error)(log_message)

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
                elif isinstance(self.exc, ClientErrors):
                    error_data['error_type'] = getattr(self.exc, 'type', type(self.exc).__name__)
                elif self._is_sqlalchemy_error(self.exc):
                    error_data['error_type'] = 'DatabaseErrors'
                else:
                    # All other unknown errors should be classified as UnknownError
                    error_data['error_type'] = 'UnknownError'
            
            # Add status code to error data
            if "status_code" not in exclude_fields:
                if isinstance(self.exc, HTTPException):
                    error_data['status_code'] = self.exc.status_code
                elif isinstance(self.exc, UserErrors):
                    error_data['status_code'] = getattr(self.exc, 'response_code', 400)
                elif isinstance(self.exc, ClientErrors):
                    error_data['status_code'] = getattr(self.exc, 'response_code', 400)
                elif self._is_sqlalchemy_error(self.exc):
                    error_data['status_code'] = 500
                else:
                    error_data['status_code'] = 500
        except Exception as e:
            Logger.error(f"Error in prepare_error_data: {str(e)}", exc_info=True)
            # Return minimal error data if preparation fails
            error_data['err'] = str(self.exc)
            error_data['error_type'] = type(self.exc).__name__
            error_data['status_code'] = 500

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

        # Validation errors are client errors (400) - no need to send email notifications
        return JSONResponse(
            status_code=400,
            content={"message": error_message, "details": reformatted_message, 'success': False},
        )
    
    async def database_error_handler(self):
        Logger.info(f"database_error_handler called for exception: {type(self.exc).__name__}")
        
        # Handle both DatabaseErrors and SQLAlchemy errors
        if isinstance(self.exc, DatabaseErrors):
            error_type = getattr(self.exc, 'type', type(self.exc).__name__)
            error_message = getattr(self.exc, 'message', str(self.exc))
            response_code = getattr(self.exc, 'response_code', 500)
        else:
            # SQLAlchemy error - convert to DatabaseErrors format
            error_type = 'DatabaseErrors'
            error_message = f"Database error: {str(self.exc)}"
            response_code = 500
            Logger.info(f"Converted SQLAlchemy error to DatabaseErrors format")
        
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
        
        # Log error and send email notification
        Logger.info("Logging error and preparing error data for email")
        self.log_error()
        data = await self.prepare_error_data(exclude_fields=["request_data"])
        # Override error_type for SQLAlchemy errors
        if not isinstance(self.exc, DatabaseErrors):
            data['error_type'] = 'DatabaseErrors'
        Logger.info(f"Error data prepared - error_type: {data.get('error_type')}, calling _publish_error_message")
        await self._publish_error_message(data)
        
        return response
    
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
            
            # Log error and send email notification for critical errors
            self.log_error()
            log_level = getattr(self.exc, 'log_level', 'ERROR')
            if log_level in ['ERROR', 'CRITICAL']:
                data = await self.prepare_error_data(exclude_fields=["request_data"])
                await self._publish_error_message(data)
            
            return response
            
        except Exception as e:
            # If error handler itself fails, log and return generic error
            Logger.error(f"Error in user_error_handler: {str(e)}", exc_info=True)
            
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
            
            # Log error
            self.log_error()
            
            return response
        except Exception as e:
            Logger.error(f"Error in client_error_handler: {str(e)}", exc_info=True)
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
            
            # Log error and send email notification
            Logger.info("unknown_error_handler: Logging error and preparing error data for email")
            self.log_error()
            data = await self.prepare_error_data(exclude_fields=["request_data"])
            Logger.info(f"unknown_error_handler: Error data prepared - error_type: {data.get('error_type')}, calling _publish_error_message")
            await self._publish_error_message(data)
            
            return response
        except Exception as e:
            # If even the error handler fails, return minimal response
            Logger.error(f"Critical error in unknown_error_handler: {str(e)}", exc_info=True)
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
    import sys
    
    # Force immediate output
    sys.stdout.write("=" * 80 + "\n")
    sys.stdout.write(f"GLOBAL EXCEPTION HANDLER CALLED\n")
    sys.stdout.write(f"Exception type: {type(exc).__name__}\n")
    sys.stdout.write(f"Exception module: {type(exc).__module__}\n")
    sys.stdout.write(f"Exception message: {str(exc)[:200]}\n")
    sys.stdout.write("=" * 80 + "\n")
    sys.stdout.flush()
    
    Logger.info(f"GLOBAL EXCEPTION HANDLER CALLED - Type: {type(exc).__name__}, Module: {type(exc).__module__}, Message: {str(exc)[:200]}")
    
    handler = ExceptionHandler(request, exc)
    result = await handler.handle_exception()
    
    sys.stdout.write(f"Exception handler completed, returning response\n")
    sys.stdout.flush()
    Logger.info(f"Exception handler completed successfully")
    
    return result


async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler for HTTPException."""
    handler = ExceptionHandler(request, exc)
    return await handler.http_exception_handler()


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler for RequestValidationError."""
    import sys
    import json
    print("=" * 80, file=sys.stdout, flush=True)
    print("VALIDATION ERROR DETECTED:", file=sys.stdout, flush=True)
    print(f"Errors: {json.dumps(exc.errors(), indent=2, default=str)}", file=sys.stdout, flush=True)
    print(f"URL: {request.url}", file=sys.stdout, flush=True)
    print(f"Method: {request.method}", file=sys.stdout, flush=True)
    print("=" * 80, file=sys.stdout, flush=True)
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
                Logger.error(
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
                Logger.error(
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
