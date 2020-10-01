import enum
from typing import Any, Optional, Dict
from typing import TypedDict


class AttributeDict(dict):
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


Version = str
Secret = str
DataDescription = Any


class ProceduralExecutionStrategy(str):
    HaltIntentful = "Halt_Intentful"


UserInfo = AttributeDict
S2S_Key = AttributeDict
Entity = AttributeDict
EntityReference = AttributeDict
Spec = AttributeDict
EntitySpec = AttributeDict
Metadata = AttributeDict
IntentWatcher = AttributeDict

class Action(str):
    Read = "read"
    Update = "write"
    Create = "create"
    Delete = "delete"
    RegisterProvider = "register_provider"
    UnregisterProvider = "unregister_provider"
    ReadProvider = "read_provider"
    UpdateAuth = "update_auth"
    CreateS2SKey = "create_key"
    ReadS2SKey = "read_key"
    InactivateS2SKey = "inactive_key"
    UpdateStatus = "update_status"


Status = Any
Provider = AttributeDict
Kind = AttributeDict


# TODO: these should be strings
class PapieaError(enum.Enum):
    Validation = "validation_error"
    BadRequest = "bad_request_error"
    ProcedureInvocation = "procedure_invocation_error"
    EntityNotFound = "entity_not_found_error"
    Unauthorized = "unauthorized_error"
    PermissionDenied = "permission_denied_error"
    ConflictingEntity = "conflicting_entity_error"
    ServerError = "server_error"


class IntentfulBehaviour(str):
    Basic = "basic"
    SpecOnly = "spec-only"
    Differ = "differ"


class IntentfulExecutionStrategy(int):
    Basic = 0


# Error description in format:
# Map<code, ErrorSchemas> where code is an error status code as string
# ErrorSchemas structure is an OpenAPI object describing error value
# Beware that an Error that user gets in the end is still of
#  a PapieaErrorResponse type
class ErrorSchema(TypedDict):
    description: Optional[str]
    structure: Optional[Any]


ErrorSchemas = Dict[str, ErrorSchema]


class ProcedureDescription(TypedDict):
    input_schema: Optional[Any]  # openapi schema representing input
    output_schema: Optional[Any]  # openapi schema representing output
    errors_schemas: Optional[ErrorSchemas]  # map of error-code to openapi schema representing error
    description: Optional[str]  # textual description of the procedure


ProviderPower = str
Key = str
ProceduralSignature = AttributeDict
IntentfulSignature = AttributeDict

class IntentfulStatus(str):
    Pending = "Pending"
    Active = "Active"
    Completed_Successfully = "Completed Successfully"
    Completed_Partially = "Completed Partially"
    Failed = "Failed"
    Outdated = "Outdated"