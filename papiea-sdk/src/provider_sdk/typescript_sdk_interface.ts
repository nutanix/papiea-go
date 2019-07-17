// [[file:~/work/papiea-js/Papiea-design.org::*Typescript:%20/src/provider_sdk/typescript_sdk_interface][Typescript: /src/provider_sdk/typescript_sdk_interface:1]]
import { Kind_Builder } from "./typescript_sdk";
import { Data_Description, Version, Status, Entity, Entity_Reference, Key } from "papiea-core";
import { Request, Response } from "express";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_provider_interface]]
// Api for the provider-sdk
export enum Provider_Power {On, Off, Suspended}

export interface Provider {
    new_kind(entity_yaml:Data_Description):Kind_Builder;
    version(version: Version):Provider;
    power(state: Provider_Power): Provider_Power;
}
// provider_sdk_ts_provider_interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_kind_interface]]
enum Procedural_Execution_Strategy {Halt_Intentful}

interface IKindImpl {

    // Adds an intentful handler. Dispatched based on the signautre passed
    on(signature: string, name: string, rbac: any, handler: (ctx:IntentfulCtx_Interface, entity:any)=>void):Intentful_Handler;

    // Convenient functions for constructing/destructing an entity. Could be implemented in terms of "on above"
    on_new(name: string, rbac: any, handler: (ctx:IntentfulCtx_Interface, entity:any)=>void):void;
    on_del(name: string, rbac: any, handler: (ctx:IntentfulCtx_Interface, entity:any)=>void):void;

    // Adds a procedural behaviour to the entity
    procedure(name: string, rbac: any,
              strategy: Procedural_Execution_Strategy,
              input_desc: string,
              output_desc: string,
              handler: (ctx:ProceduralCtx_Interface, input:any)=>any):void;


    // Visualize all the intentful handlers and their priority
    visualize_intentful_handlers(filename:string):boolean;
}
// provider_sdk_ts_kind_interface ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_intentful_handler_interface]]
export interface Intentful_Handler {
    // Establishes a dependency tree between the various handlers
    before(...handlers: Intentful_Handler[]):void;
}
// provider_sdk_ts_intentful_handler_interface ends here

export interface UserInfo {
    name?: string,
    key: Key,
    owner: string,
    extension: any
}

export interface SecurityApi {
 // Returns the user-info of user with s2skey or the current user 
 user_info(other_s2skey?:Key): Promise<UserInfo>
 list_keys(other_s2skey?:Key): Promise<Key[]>
 create_key(new_key: {key:Key, extension:any}, other_s2skey?:Key):Promise<Key>
 deactivate_key(key_to_deactivate:Key, other_s2skey?:Key):Promise<Key>
}

// [[file:~/work/papiea-js/Papiea-design.org::#h-Providers-SDK-518][provider_sdk_ts_intentful_ctx_interface]]
export interface IntentfulCtx_Interface {
    update_status(entity_reference: Entity_Reference, status: Status):Promise<boolean>
    update_progress(message:string, done_percent:number):boolean
    url_for(entity: Entity): string
    get_security_api(): SecurityApi
    get_request(): Request
    get_response(): Response
}

// For the time being these are equal. Later they may differ
export type ProceduralCtx_Interface=IntentfulCtx_Interface;
// provider_sdk_ts_intentful_ctx_interface ends here
// Typescript: /src/provider_sdk/typescript_sdk_interface:1 ends here
