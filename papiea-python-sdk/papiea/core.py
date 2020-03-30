from typing import Any


class AttributeDict(dict):
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


Version = str
Secret = str
DataDescription = Any
ProceduralExecutionStrategy = str
UserInfo = AttributeDict
S2S_Key = AttributeDict
Entity = AttributeDict
EntityReference = AttributeDict
Action = str
Status = Any
Provider = AttributeDict
Kind = AttributeDict
IntentfulExecutionStrategy = str
ProviderPower = str
Key = str
ProceduralSignature = AttributeDict
IntentfulSignature = AttributeDict


class ProceduralExecutionStrategies(object):
    HaltIntentful = "Halt_Intentful"


class IntentfulExecutionStrategies(object):
    Basic = "basic"
    SpecOnly = "spec-only"
    Differ = "differ"


class Actions(object):
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
