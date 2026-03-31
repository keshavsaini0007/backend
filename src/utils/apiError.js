class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        statck = ""
    ){
        super(message)
        this.errors = errors
        this.statusCode = statusCode
        this.message = message
        this.data = null
        this.success =  false

        if(statck){
            this.statck = statck
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
export {ApiError}