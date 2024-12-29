class ApiError extends Error {
  constructor(statusCode, message) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;

const createError = {
  badRequest: (message = "Bad Request") => new ApiError(400, message),
  unauthorized: (message = "Unauthorized") => new ApiError(401, message),
  forbidden: (message = "Forbidden") => new ApiError(403, message),
  notFound: (message = "Not Found") => new ApiError(404, message),
  wrongPassword: (message = "Wrong Password") => new ApiError(422, message),
  wrongData: (message = "Invalid or Incorrect Data") =>
    new ApiError(422, message),
  other: (message = "An Error Occurred") => new ApiError(500, message),
  internalServerError: (message = "Internal Server Error") =>
    new ApiError(500, message),
};

export { ApiError, createError };
