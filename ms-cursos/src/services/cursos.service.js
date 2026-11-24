const repository = require('../repositories/cursos.repository');
const { validarCurso, construirCurso } = require('../models/curso');
const HttpError = require('../utils/http-error');
const salonesClient = require('../clients/salones.client');

function componerCurso(curso, salon, aviso) {
  const resultado = {
    ...curso,
    salon: salon ? {
      id: salon.id,
      codigo_salon: salon.codigo_salon,
      edificio: salon.edificio,
    } : null,
  };

  if (aviso) {
    resultado.aviso = aviso;
  }

  return resultado;
}

async function validarSalon(curso, token) {
  const salon = await salonesClient.obtener(curso.salon_id, token);

  if (!salon) {
    throw new HttpError(400, 'El salón indicado no existe');
  }

  if (curso.cupo > salon.capacidad) {
    throw new HttpError(400, 'El cupo del curso no puede superar la capacidad del salón');
  }

  return salon;
}

async function buscarCurso(id) {
  const curso = await repository.findById(id);

  if (!curso) {
    throw new HttpError(404, 'Curso no encontrado');
  }

  return curso;
}

function prepararCurso(datos) {
  const errores = validarCurso(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos del curso inválidos', errores);
  }

  return construirCurso(datos);
}

async function verificarCodigoDisponible(codigo, idActual = null) {
  const existente = await repository.findByCodigo(codigo);

  if (existente && existente.id !== idActual) {
    throw new HttpError(409, 'Ya existe un curso con ese código');
  }
}

async function findAll(filtros = {}, token) {
  if (filtros.semestre !== undefined) {
    if (
      typeof filtros.semestre !== 'string' ||
      !/^[0-9]{4}-[12]$/.test(filtros.semestre)
    ) {
      throw new HttpError(
        400,
        'semestre debe tener el formato AAAA-1 o AAAA-2'
      );
    }
  }

  const cursos = await repository.findAll(filtros);

  if (cursos.length === 0) {
    return [];
  }

  let salones;

  try {
    salones = await salonesClient.obtenerPorIds(cursos.map((curso) => curso.salon_id), token);
  } catch (error) {
    if (error.status !== 503) {
      throw error;
    }

    return cursos.map((curso) => componerCurso(curso, null, 'El servicio de salones no está disponible'));
  }

  const porId = new Map(salones.map((salon) => [salon.id, salon]));

  return cursos.map((curso) => {
    const salon = porId.get(curso.salon_id);
    return componerCurso(curso, salon, salon ? undefined : 'El salón asociado no existe');
  });
}

async function findById(id, token) {
  const curso = await buscarCurso(id);
  let salon;

  try {
    salon = await salonesClient.obtener(curso.salon_id, token);
  } catch (error) {
    if (error.status !== 503) {
      throw error;
    }

    return componerCurso(curso, null, 'El servicio de salones no está disponible');
  }

  return componerCurso(curso, salon, salon ? undefined : 'El salón asociado no existe');
}

async function create(datos, token) {
  const curso = prepararCurso(datos);
  const salon = await validarSalon(curso, token);

  await verificarCodigoDisponible(curso.codigo);

  try {
    const creado = await repository.create(curso);
    return componerCurso(creado, salon);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Ya existe un curso con ese código');
    }

    throw error;
  }
}

async function update(id, datos, token) {
  await buscarCurso(id);

  const curso = prepararCurso(datos);
  const salon = await validarSalon(curso, token);

  await verificarCodigoDisponible(curso.codigo, id);

  try {
    const actualizado = await repository.update(id, curso);

    if (!actualizado) {
      throw new HttpError(404, 'Curso no encontrado');
    }

    return componerCurso(actualizado, salon);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Ya existe un curso con ese código');
    }

    throw error;
  }
}

async function remove(id) {
  const eliminado = await repository.remove(id);

  if (!eliminado) {
    throw new HttpError(404, 'Curso no encontrado');
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
