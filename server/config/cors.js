const DEFAULT_CLIENT_ORIGINS = [
  'http://localhost:5173',
];

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/+$/, '');

const getAllowedClientOrigins = () => {
  const configuredOrigins = String(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return [...new Set([...DEFAULT_CLIENT_ORIGINS, ...configuredOrigins])];
};

const createCorsOriginValidator = () => {
  const allowedOrigins = new Set(getAllowedClientOrigins());

  return (origin, callback) => {
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  };
};

export { createCorsOriginValidator, getAllowedClientOrigins };
