export class AxiosResponseParser {
    public static getAxiosErrorResponse(err: any): any | null {
        if (err) {
            if (err.response) {
                return err.response
            }
            console.info("Received null/undefined value for error response")
        } else {
            console.info("Received null/undefined value for axios error")
        }
        return null
    }
    
    public static getAxiosResponseData(err: any): any | null {
        const response  = AxiosResponseParser.getAxiosErrorResponse(err)
        if (response) {
            if (response.data) {
                return response.data
            }
            console.info("Received null/undefined value for response data")
        }
        return null
    }
    
    public static getAxiosResponseStatus(err: any): number {
        const response  = AxiosResponseParser.getAxiosErrorResponse(err)
        if (response) {
            if (response.data) {
                return response.status
            }
            console.info("Received null/undefined value for response status")
        }
        return 500
    }
    
    public static getAxiosError(err: any): any | null {
        const data = AxiosResponseParser.getAxiosResponseData(err)
        if (data) {
            if (data.error) {
                return data.error
            }
            console.info("Recieved null/undefined for data error")
        }
        return null
    }
    
    public static getAxiosErrorCode(err: any): number {
        const axios_error = AxiosResponseParser.getAxiosError(err)
        if (axios_error) {
            if (axios_error.code) {
                return axios_error.code
            }
            console.info("Received null/undefined value for error code")
        }
        return 500
    }
    
    public static getAxiosErrorEntityInfo(err: any): any | null {
        const axios_error = AxiosResponseParser.getAxiosError(err)
        if (axios_error) {
            if (axios_error.entity_info) {
                return axios_error.entity_info
            }
            console.info("Received null/undefined value for entity info")
        }
        return null
    }
    
    public static getAxiosErrors(err: any): any | null {
        const axios_error = AxiosResponseParser.getAxiosError(err)
        if (axios_error) {
            if (axios_error.errors) {
                return axios_error.errors
            }
            console.info("Received null/undefined value for errors")
        }
        return null
    }
    
    public static getAxiosErrorMessages(err: any): string[] {
        const errors = AxiosResponseParser.getAxiosErrors(err)
        const message_list: string[] = []
        if (errors) {
            errors.forEach((error: any) => {
                if (error.message) {
                    message_list.push(error.message)
                } else {
                    console.info("Received null/undefined value for error message")
                }
            });
        }
        return message_list
    }
    
    public static getAxiosErrorTraces(err: any): string[] {
        const errors = AxiosResponseParser.getAxiosErrors(err)
        const trace_list: string[] = []
        if (errors) {
            errors.forEach((error: any) => {
                if (error.stacktrace) {
                    trace_list.push(error.stacktrace)
                } else {
                    console.info("Received null/undefined value for error trace")
                }
            });
        }
        return trace_list
    }
    
}

