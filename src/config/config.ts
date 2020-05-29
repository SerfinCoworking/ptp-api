export const env = {
    API_URI_PREFIX: '/api',
    JWT_SECRET: 'e18a33b0-9866-4867-800a-d6ffcd8f1cbd',
    TOKEN_LIFETIME: 1,
    MONGODB_CONNECTION: 'mongodb://localhost/ptp-db'
};

export const HttpCodes: { [key: string ]: number } = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    RESOURCE_NOT_FOUND: 404,
    EXPIRED_TOKEN: 406,
    EXPECTATION_FAILED: 417,
    SERVER_ERROR: 500,
  };
