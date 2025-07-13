/**
 * Middleware específico para Railway que maneja CORS de manera más permisiva
 * Este middleware se ejecuta antes que el middleware de CORS principal
 */
const railwayCorsHandler = (req, res, next) => {
  // Headers básicos de CORS para Railway
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, User-Agent, Referer'
  );
  res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Total-Pages');
  res.header('Access-Control-Max-Age', '86400');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

module.exports = railwayCorsHandler;
