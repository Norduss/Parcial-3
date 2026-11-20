const app = require('./app');
const pool = require('./db');

async function iniciar() {
  const variablesRequeridas = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
  ];

  for (const variable of variablesRequeridas) {
    if (!process.env[variable]) {
      throw new Error(`Falta configurar ${variable} en el archivo .env`);
    }
  }

  const host = process.env.HOST || '127.0.0.1';
  const puerto = Number(process.env.PORT || 3011);

  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535');
  }

  await pool.execute('SELECT 1');

  console.log('[ms-cursos] Conexión con MySQL verificada');

  const servidor = app.listen(puerto, host, () => {
    console.log(`[ms-cursos] Escuchando en http://${host}:${puerto}`);
  });

  servidor.on('error', (error) => {
    detenerPorError(error);
  });
}

async function detenerPorError(error) {
  console.error(`[ms-cursos] No se pudo iniciar: ${error.message}`);

  try {
    await pool.end();
  } finally {
    process.exitCode = 1;
  }
}

iniciar().catch(detenerPorError);