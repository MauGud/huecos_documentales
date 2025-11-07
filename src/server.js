const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes - deben ir ANTES de static files
app.use('/api', routes);

// ═══════════════════════════════════════════════════════════════
// RUTAS EXPLÍCITAS PARA ARCHIVOS CRÍTICOS (PRIORIDAD MÁXIMA)
// ═══════════════════════════════════════════════════════════════
// Estas rutas deben ir ANTES de express.static para garantizar
// que se sirvan correctamente en producción (Vercel/Heroku/etc)

app.get('/styles.css', (req, res) => {
  const cssPath = path.join(__dirname, '..', 'public', 'styles.css');
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(cssPath, (err) => {
    if (err) {
      console.error('Error sirviendo styles.css:', err);
      res.status(404).send('/* CSS file not found */');
    }
  });
});

app.get('/app_new.js', (req, res) => {
  const jsPath = path.join(__dirname, '..', 'public', 'app_new.js');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(jsPath, (err) => {
    if (err) {
      console.error('Error sirviendo app_new.js:', err);
      res.status(404).send('// JS file not found');
    }
  });
});

// Servir index.html en la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Servir archivos estáticos (para otros archivos como imágenes, etc.)
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: true,
  index: false // No servir index.html automáticamente (ya lo hacemos arriba)
}));

// Catch-all route para SPA - debe ir al final, después de todas las rutas
// IMPORTANTE: Solo captura rutas que NO sean archivos estáticos ni API
app.get('*', (req, res, next) => {
  // Ignorar si es una ruta de API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Endpoint no encontrado'
    });
  }
  
  // Ignorar si es un archivo estático (debe tener extensión)
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml'];
  const hasExtension = staticExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
  
  if (hasExtension) {
    // Si es un archivo estático que no se encontró, devolver 404
    return res.status(404).send('File not found');
  }
  
  // Para todas las demás rutas (SPA routes), servir index.html
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler - debe ir después de todas las rutas
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Para Vercel (serverless) - exportar la app
module.exports = app;

// Para desarrollo local - iniciar servidor
if (require.main === module) {
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
    console.log(`📊 Frontend disponible en http://localhost:${PORT}`);
    console.log(`🔗 API Nexcar: https://nexcar-api-770231222dff.herokuapp.com`);
  });
}