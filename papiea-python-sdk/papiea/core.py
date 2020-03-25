from typing import Any

Version = str
Secret = str
DataDescription = Any
ProceduralExecutionStrategy = str
UserInfo = dict
S2S_Key = dict
Entity = dict
EntityReference = dict
Action = str
Status = Any
Provider = dict
Kind = dict


class IntentfulExecutionStrategy(object):
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
