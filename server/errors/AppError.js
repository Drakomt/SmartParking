class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', cause } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default AppError;
