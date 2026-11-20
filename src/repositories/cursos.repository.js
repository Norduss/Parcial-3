const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM cursos';
  const valores = [];

  if (filtros.semestre !== undefined) {
    sql += ' WHERE semestre = ?';
    valores.push(filtros.semestre);
  }

  sql += ' ORDER BY id';

  const [filas] = await pool.execute(sql, valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.execute(
    'SELECT * FROM cursos WHERE id = ?',
    [id]
  );

  return filas[0] || null;
}

async function findByCodigo(codigo) {
  const [filas] = await pool.execute(
    'SELECT * FROM cursos WHERE codigo = ?',
    [codigo]
  );

  return filas[0] || null;
}

async function create(curso) {
  const [resultado] = await pool.execute(
    `INSERT INTO cursos (codigo, nombre, creditos, cupo, semestre)
     VALUES (?, ?, ?, ?, ?)`,
    [
      curso.codigo,
      curso.nombre,
      curso.creditos,
      curso.cupo,
      curso.semestre,
    ]
  );

  return findById(resultado.insertId);
}

async function update(id, curso) {
  await pool.execute(
    `UPDATE cursos
     SET codigo = ?, nombre = ?, creditos = ?, cupo = ?, semestre = ?
     WHERE id = ?`,
    [
      curso.codigo,
      curso.nombre,
      curso.creditos,
      curso.cupo,
      curso.semestre,
      id,
    ]
  );

  return findById(id);
}

async function remove(id) {
  const [resultado] = await pool.execute(
    'DELETE FROM cursos WHERE id = ?',
    [id]
  );

  return resultado.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findByCodigo,
  create,
  update,
  remove,
};