import {
    LOG_LEVELS, LogLevel, logLevelFromString, LoggerOptions, Logger,
    LoggerFactory, LoggerHandle, LoggingVerbosityOptions
} from './logging';

import {dotnotation} from './dotnotation'
import {getTracer, getTracingMiddleware, TracingCtx, spanOperation, spanEntityOperation, getTraceHeaders} from "./tracing"
import { Provider } from 'papiea-core';
import e = require('express');

interface RequestContext {
    tracing_ctx: TracingCtx
}

export {
    LOG_LEVELS, LogLevel, logLevelFromString, LoggerOptions, Logger,
    LoggerFactory, dotnotation, LoggerHandle, LoggingVerbosityOptions,
    getTracer, getTracingMiddleware, spanOperation, spanEntityOperation,
    RequestContext, getTraceHeaders
};

export class EntityLoggingInfo {
    provider_prefix: string;
    provider_version: string;
    kind_name: string;
    additional_info: { [key: string]: string; };

    constructor(provider_prefix: string, provider_version: string, kind_name: string, additional_info: { [key: string]: string; } = {}) {
        this.provider_prefix = provider_prefix;
        this.provider_version = provider_version;
        this.kind_name = kind_name;
        this.additional_info = additional_info;
    }

    toString(): string {
        let entity_info_str: string = '';

        if (this.provider_prefix !== '') {
            entity_info_str = entity_info_str + "provider_prefix: " + this.provider_prefix;
        }
        if (this.provider_version !== '') {
            if (entity_info_str !== '') {
                entity_info_str = entity_info_str + ', '
            }
            entity_info_str = entity_info_str + "provider_version: " + this.provider_version;
        }
        if (this.kind_name !== '') {
            if (entity_info_str !== '') {
                entity_info_str = entity_info_str + ', '
            }
            entity_info_str = entity_info_str + "kind_name: " + this.kind_name;
        }
        if (this.additional_info && Object.keys(this.additional_info).length > 0) {
            for (let field in this.additional_info) {
                if (entity_info_str !== '') {
                    entity_info_str = entity_info_str + ', '
                }    
                entity_info_str = entity_info_str + field + ": " + this.additional_info[field];
            }
        }
        if (entity_info_str !== '') {
            entity_info_str = "{ " + entity_info_str + " }";
        }

        return entity_info_str;
    }
}