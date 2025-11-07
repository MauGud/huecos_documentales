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

// Rutas explícitas para archivos críticos (solo para producción)
// Estas rutas tienen prioridad sobre express.static
app.get('/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'public', 'styles.css'));
});

app.get('/app_new.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, '..', 'public', 'app_new.js'));
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Servir index.html en la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Catch-all route para SPA - debe ir al final, después de todas las rutas
// Esto maneja rutas del frontend como /auth, /search, etc.
app.get('*', (req, res) => {
  // Solo servir index.html si no es una ruta de API
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Endpoint no encontrado'
    });
  }
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