export class CustomValidationError extends Error {
    error: any;
    constructor(error) {
        super();
        this.error = error;
    }
}