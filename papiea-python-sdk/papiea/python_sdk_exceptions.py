from typing import Optional, Any, List

class InvocationError(Exception):
    def __init__(self, status_code: int, message: str, errors: List[Any], stack: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.errors = errors
        self.stack = stack

    @staticmethod
    def from_error(e: Exception) -> InvocationError:
        return InvocationError(500, str(e), [e])

    def to_response(self) -> dict:
        return {
            "errors": self.errors,
            "message": self.message,
            "stacktrace": self.stack
        }

class SecurityApiError(InvocationError):

    @staticmethod
    def from_error(e: Exception, message: str) -> SecurityApiError:
        return SecurityApiError(500, message, [e])
