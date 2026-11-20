const service = require('../services/cursos.service');
const HttpError = require('../utils/http-error');

function validarId(valor) {
  const id = Number(valor);

  if (
    !/^[0-9]+$/.test(valor) ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2147483647
  ) {
    throw new HttpError(400, 'El ID debe ser un entero positivo válido');
  }

  return id;
}

async function findAll(req, res, next) {
  try {
    const cursos = await service.findAll({
      semestre: req.query.semestre,
    });

    res.status(200).json(cursos);
  } catch (error) {
    next(error);
  }
}

async function findById(req, res, next) {
  try {
    const id = validarId(req.params.id);
    const curso = await service.findById(id);

    res.status(200).json(curso);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const curso = await service.create(req.body);

    res.location(`${req.baseUrl}/${curso.id}`);
    res.status(201).json(curso);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = validarId(req.params.id);
    const curso = await service.update(id, req.body);

    res.status(200).json(curso);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = validarId(req.params.id);

    await service.remove(id);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};