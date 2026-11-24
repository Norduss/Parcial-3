const HttpError = require('../utils/http-error');
const SALONES_URL = process.env.SALONES_URL;

async function pedir(ruta, token) {
  try {
    return await fetch(`${SALONES_URL}${ruta}`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    return null;
  }
}

async function leerRespuesta(respuesta) {
  if (!respuesta) {
    throw new HttpError(503, 'El servicio de salones no está disponible');
  }

  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new HttpError(respuesta.status, 'El servicio de salones rechazó la autorización');
  }

  if (!respuesta.ok) {
    throw new HttpError(503, 'El servicio de salones no pudo completar la consulta');
  }

  try {
    return await respuesta.json();
  } catch (error) {
    throw new HttpError(503, 'El servicio de salones devolvió una respuesta inválida');
  }
}

async function obtener(id, token) {
  const respuesta = await pedir(`/salones/${id}`, token);

  if (respuesta && respuesta.status === 404) {
    return null;
  }

  const salon = await leerRespuesta(respuesta);

  if (
    !salon || salon.id !== id ||
    !Number.isInteger(salon.capacidad) || salon.capacidad <= 0
  ) {
    throw new HttpError(503, 'El servicio de salones devolvió una respuesta inválida');
  }

  return salon;
}

async function obtenerPorIds(ids, token) {
  const unicos = [...new Set(ids)];

  if (unicos.length === 0) {
    return [];
  }

  const respuesta = await pedir(`/salones?ids=${unicos.join(',')}`, token);
  const salones = await leerRespuesta(respuesta);

  if (!Array.isArray(salones)) {
    throw new HttpError(503, 'El servicio de salones devolvió una respuesta inválida');
  }

  return salones;
}

module.exports = { pedir, obtener, obtenerPorIds };
