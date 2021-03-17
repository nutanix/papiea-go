import enum
from typing import Any, Callable, Optional, Dict, Union, List, TypedDict


class AttributeDict(dict):
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


Version = str
Secret = str
DataDescription = Any
SFS = str
ProviderCallbackUrl = str


class ProceduralExecutionStrategy(str):
    HaltIntentful = 0


class IntentfulExecutionStrategy(int):
    Basic = 0


ProceduralSignature = AttributeDict

# class ProceduralSignature(TypedDict):
#     name: str
#     argument: DataDescription
#     result: DataDescription
#     execution_strategy: Union[ProceduralExecutionStrategy, IntentfulExecutionStrategy]
#     procedure_callback: ProviderCallbackUrl
#     base_callback: ProviderCallbackUrl
#     description: Optional[str]
#     errors_schemas: Optional['ErrorSchemas']


# Cannot inherit this because of
# non-default arguments follows default argument, waiting for Python to work around this MRO inconvenience

IntentfulSignature = AttributeDict
# class IntentfulSignature(TypedDict):
#     name: str
#     argument: DataDescription
#     result: DataDescription
#     execution_strategy: Union[ProceduralExecutionStrategy, IntentfulExecutionStrategy]
#     procedure_callback: ProviderCallbackUrl
#     base_callback: ProviderCallbackUrl
#     signature: SFS
#     description: Optional[str]
#     errors_schemas: Optional['ErrorSchemas']


CreateS2SKeyRequest = AttributeDict

# class CreateS2SKeyRequest(TypedDict):
#     user_info: 'UserInfo'
#     owner: Optional[str]
#     key: Optional[Secret]
#     name: Optional[str]


S2SKey = AttributeDict

# class S2SKey(TypedDict):
#     owner: str
#     provider_prefix: str
#     key: Secret
#     uuid: str
#     created_at: Any
#     deleted_at: Any
#     user_info: 'UserInfo'
#     name: Optional[str]


UserInfo = Dict[str, Any]


Entity = AttributeDict

# class Entity(TypedDict):
#     metadata: 'Metadata'
#     spec: 'Spec'
#     status: 'Status'


EntityReference = AttributeDict

# class EntityReference(TypedDict):
#     uuid: str
#     kind: str
#     name: Optional[str]
#
#
# class ProviderEntityReference(EntityReference):
#     provider_prefix: str
#     provider_version: Version


Spec = AttributeDict
Status = AttributeDict


EntitySpec = AttributeDict

# class EntitySpec(TypedDict):
#     metadata: 'Metadata'
#     spec: 'Spec'


Metadata = AttributeDict

# class Metadata(ProviderEntityReference):
#     spec_version: int
#     created_at: Any
#     deleted_at: Optional[Any]
#     extension: Optional[Dict[str, Any]]


class ConstructorResult(TypedDict):
    spec: Spec
    status: Status
    metadata: Optional[Union['Metadata', Any]]


class DiffContent:
    keys: Any
    key: str
    path: List[Union[str, int]]
    spec: Union[List[int], List[str]]
    status: Union[List[int], List[str]]


class Diff(TypedDict):
    kind: str
    intentful_signature: 'IntentfulSignature'
    diff_fields: List[DiffContent]
    handler_url: Optional[str]


IntentWatcher = AttributeDict

# class IntentWatcher(TypedDict):
#     uuid: str
#     entity_ref: ProviderEntityReference
#     spec_version: int
#     diffs: List[Diff]
#     status: 'IntentfulStatus'
#     user: Optional[UserInfo]
#     last_status_changed: Optional[Any]
#     created_at: Optional[Any]


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


Provider = AttributeDict

# class Provider(TypedDict):
#     prefix: str
#     version: Version
#     kinds: List['Kind']
#     procedures: Dict[str, ProceduralSignature]
#     extension_structure: DataDescription
#     allowExtraProps: bool
#     created_at: Optional[Any]
#     policy: Optional[str]
#     oauth: Optional[str]
#     authModel: Optional[str]


Kind = AttributeDict

# class Kind(TypedDict):
#     name: str
#     kind_structure: DataDescription
#     intentful_behaviour: 'IntentfulBehaviour'
#     intentful_signatures: List[IntentfulSignature]
#     dependency_tree: Dict[SFS, List[SFS]]
#     entity_procedures: Dict[str, ProceduralSignature]
#     kind_procedures: Dict[str, ProceduralSignature]
#     uuid_validation_pattern: Optional[str]
#     name_plural: Optional[str]
#     differ: Optional[Any]
#     diff_delay: Optional[int]
#     diff_selection_strategy: Optional['DiffSelectionStrategy']


class PapieaError(enum.Enum):
    Validation = "validation_error"
    BadRequest = "bad_request_error"
    ProcedureInvocation = "procedure_invocation_error"
    EntityNotFound = "entity_not_found_error"
    Unauthorized = "unauthorized_error"
    PermissionDenied = "permission_denied_error"
    ConflictingEntity = "conflicting_entity_error"
    ServerError = "server_error"


class DiffSelectionStrategy(enum.Enum):
    Basic = "basic"
    Random = "random"


class IntentfulBehaviour(str):
    Basic = "basic"
    SpecOnly = "spec-only"
    Differ = "differ"


# Error description in format:
# Map<code, ErrorSchemas> where code is an error status code as string
# ErrorSchemas structure is an OpenAPI object describing error value
# Beware that an Error that user gets in the end is still of
#  a PapieaErrorResponse type
class ErrorSchema(TypedDict):
    description: Optional[str]
    structure: Optional[Any]


ErrorSchemas = Dict[str, ErrorSchema]

ProcedureDescription = AttributeDict

# class ProcedureDescription(TypedDict):
#     input_schema: Optional[Any]  # openapi schema representing input
#     output_schema: Optional[Any]  # openapi schema representing output
#     errors_schemas: Optional[ErrorSchemas]  # map of error-code to openapi schema representing error
#     description: Optional[str]  # textual description of the procedure
#
#

class ConstructorProcedureDescription(TypedDict):
    input_schema: Optional[Any]  # openapi schema representing input
    errors_schemas: Optional[ErrorSchemas]  # map of error-code to openapi schema representing error


ProviderPower = str
Key = str


class IntentfulStatus(str):
    Pending = "Pending"
    Active = "Active"
    Completed_Successfully = "Completed Successfully"
    Completed_Partially = "Completed Partially"
    Failed = "Failed"
    Outdated = "Outdated"

BackgroundTaskCallback = Callable[[Optional[Any]], Any]