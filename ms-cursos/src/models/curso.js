function validarCurso(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON'];
  }

  const errores = [];

  if (
    !Number.isInteger(datos.salon_id) ||
    datos.salon_id <= 0 ||
    datos.salon_id > 2147483647
  ) {
    errores.push('salon_id debe ser un entero positivo válido para MySQL');
  }

  for (const [campo, limite] of [['codigo', 30], ['nombre', 120]]) {
    if (typeof datos[campo] !== 'string' || datos[campo].trim() === '') {
      errores.push(`${campo} es obligatorio`);
    } else if (datos[campo].trim().length > limite) {
      errores.push(`${campo} no puede superar ${limite} caracteres`);
    }
  }

  if (
    !Number.isInteger(datos.creditos) ||
    datos.creditos < 1 ||
    datos.creditos > 6
  ) {
    errores.push('creditos debe ser un entero entre 1 y 6');
  }

  if (
    !Number.isInteger(datos.cupo) ||
    datos.cupo <= 0 ||
    datos.cupo > 2147483647
  ) {
    errores.push('cupo debe ser un entero positivo válido para MySQL');
  }

  if (
    typeof datos.semestre !== 'string' ||
    !/^[0-9]{4}-[12]$/.test(datos.semestre.trim())
  ) {
    errores.push('semestre debe tener el formato AAAA-1 o AAAA-2');
  }

  return errores;
}

function construirCurso(datos) {
  return {
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    creditos: datos.creditos,
    cupo: datos.cupo,
    semestre: datos.semestre.trim(),
    salon_id: datos.salon_id,
  };
}

module.exports = { validarCurso, construirCurso };
