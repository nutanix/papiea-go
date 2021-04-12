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
    
    public static getAxiosErrorContext(err: any): any | null {
        const axios_error = AxiosResponseParser.getAxiosError(err)
        if (axios_error) {
            if (axios_error.papiea_context) {
                return axios_error.papiea_context
            }
            console.info("Received null/undefined value for papiea context")
        }
        return null
    }
    
    public static getAxiosErrorDetails(err: any): any | null {
        const axios_error = AxiosResponseParser.getAxiosError(err)
        if (axios_error) {
            if (axios_error.error_details) {
                return axios_error.error_details
            }
            console.info("Received null/undefined value for error details")
        }
        return null
    }
    
    public static getAxiosErrorMessage(err: any): string {
        const axios_error_details = AxiosResponseParser.getAxiosErrorDetails(err)
        if (axios_error_details) {
            if (axios_error_details.message) {
                return axios_error_details.message
            }
            console.info("Received null/undefined value for error message")
        }
        return ''
    }
}

