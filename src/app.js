const express = require('express');
const cursosRoutes = require('./routes/cursos.routes');
const HttpError = require('./utils/http-error');

const app = express();

app.use((req, res, next) => {
  const inicio = Date.now();
  const metodo = req.method;
  const ruta = req.originalUrl;

  res.on('finish', () => {
    const duracion = Date.now() - inicio;

    console.log(
      `[ms-cursos] ${metodo} ${ruta} - HTTP ${res.statusCode} - ${duracion}ms`
    );
  });

  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    servicio: 'ms-cursos',
    estado: 'ok',
  });
});

app.use('/cursos', cursosRoutes);

app.use((req, res, next) => {
  next(new HttpError(404, 'Ruta no encontrada'));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      mensaje: 'El cuerpo de la petición contiene un JSON inválido',
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      mensaje: 'El cuerpo de la petición supera el tamaño permitido',
    });
  }

  const status = error instanceof HttpError ? error.status : 500;

  if (status >= 500) {
    console.error(`[ms-cursos] Error interno: ${error.message}`);
  }

  const respuesta = {
    mensaje: status >= 500 ? 'Error interno del servidor' : error.message,
  };

  if (status < 500 && error.detalles !== undefined) {
    respuesta.detalles = error.detalles;
  }

  res.status(status).json(respuesta);
});

module.exports = app;