const repository = require('../repositories/cursos.repository');
const { validarCurso, construirCurso } = require('../models/curso');
const HttpError = require('../utils/http-error');

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

async function findAll(filtros = {}) {
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

  return repository.findAll(filtros);
}

async function findById(id) {
  const curso = await repository.findById(id);

  if (!curso) {
    throw new HttpError(404, 'Curso no encontrado');
  }

  return curso;
}

async function create(datos) {
  const curso = prepararCurso(datos);

  await verificarCodigoDisponible(curso.codigo);

  try {
    return await repository.create(curso);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Ya existe un curso con ese código');
    }

    throw error;
  }
}

async function update(id, datos) {
  await findById(id);

  const curso = prepararCurso(datos);

  await verificarCodigoDisponible(curso.codigo, id);

  try {
    const actualizado = await repository.update(id, curso);

    if (!actualizado) {
      throw new HttpError(404, 'Curso no encontrado');
    }

    return actualizado;
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