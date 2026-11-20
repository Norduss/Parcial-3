# ms-cursos · preparación del parcial Módulo 3

Microservicio REST para registrar, consultar, actualizar y eliminar cursos, y
filtrarlos por semestre. Utiliza Node.js, Express y MySQL, con JWT emitidos por
ms-usuarios. Su preparación y ejecución previas al examen son locales.

**Debe permanecer sin desplegar en las máquinas virtuales antes del examen.**

## Requisitos e instalación

- Node.js 22.9 o posterior y npm.
- MySQL 8. Para aplicar las restricciones CHECK del esquema, utilizar 8.0.16 o posterior.
- Postman para pruebas HTTP manuales.
- Acceso a ms-usuarios para obtener tokens de cuentas activas.

Desde esta carpeta.

~~~bash
npm install
~~~

## Configuración local

Copiar [.env.example](.env.example) a .env si todavía no existe y completar los
valores privados. Conservar una configuración vigente cuando ya exista el archivo.

| Variable | Configuración y propósito |
| --- | --- |
| PORT | 3011. |
| HOST | 127.0.0.1 para ejecución local. |
| DB_HOST, DB_PORT | Servidor MySQL y puerto, normalmente 127.0.0.1 y 3306 en desarrollo. |
| DB_NAME | cursos_db, coherente con el USE del esquema. |
| DB_USER, DB_PASSWORD | Cuenta MySQL de Cursos y su contraseña privada. |
| JWT_SECRET | La misma clave privada utilizada por Usuarios para firmar tokens. |

El ejemplo es una plantilla. Sus valores de acceso deben revisarse para la
instalación propia. .env y node_modules/ están excluidos por el .gitignore del
repositorio. Los tokens y las credenciales se conservan localmente.

Al iniciar, src/index.js exige DB_HOST, DB_NAME, DB_USER, DB_PASSWORD y JWT_SECRET,
valida PORT y ejecuta SELECT 1 en MySQL. Si falla esa preparación, informa el error
y finaliza. La tabla se prepara con el esquema antes de utilizar el CRUD.

## Base de datos y datos iniciales

Crear cursos_db en MySQL Workbench o la consola con una cuenta con permisos para
administrar bases. Crear o utilizar una cuenta privada de Cursos y concederle
permisos sobre cursos_db.*. Los valores deben coincidir con los configurados en .env.

~~~sql
CREATE DATABASE cursos_db CHARACTER SET utf8mb4;
~~~

En una instalación nueva, abrir [db/schema.sql](db/schema.sql) en Workbench y
ejecutarlo, o desde una consola MySQL iniciada en esta carpeta.

~~~sql
SOURCE db/schema.sql;
~~~

El archivo selecciona cursos_db, crea la tabla cursos y carga tres filas.

| codigo | nombre | creditos | cupo | semestre |
| --- | --- | --- | --- | --- |
| RSM101 | Redes y Servicios Multimedia | 3 | 30 | 2026-2 |
| PROG101 | Programación I | 4 | 25 | 2026-1 |
| BD101 | Bases de Datos | 3 | 20 | 2026-2 |

id es un INT autoincremental y codigo tiene restricción UNIQUE. El esquema utiliza
CREATE TABLE e INSERT directos. Se importa una vez sobre una base nueva y requiere
revisión antes de repetirlo sobre datos existentes.

## Ejecución

~~~bash
npm run dev
~~~

También está disponible npm start. Ambos scripts cargan .env. La URL local es
http://127.0.0.1:3011. GET /health es público y devuelve 200 con el siguiente objeto.

~~~json
{"servicio":"ms-cursos","estado":"ok"}
~~~

## Estructura por capas

| Archivo | Responsabilidad |
| --- | --- |
| src/routes/cursos.routes.js | Rutas, autenticación y autorización por rol. |
| src/controllers/cursos.controller.js | Parámetros, validación de ID y respuestas HTTP. |
| src/services/cursos.service.js | Validaciones, existencia, filtro y unicidad de código. |
| src/repositories/cursos.repository.js | Consultas MySQL parametrizadas. |
| src/models/curso.js | Validación y construcción de los atributos de Curso. |
| src/db.js | Pool MySQL. |
| src/middlewares/auth.js | Verificación JWT y comprobación de roles. |
| src/app.js, src/index.js | Middleware JSON, salud, errores y arranque. |

## Contrato y endpoints

Todas las rutas /cursos requieren Authorization con Bearer y un JWT válido.
Los GET admiten cualquier usuario autenticado. POST, PUT y DELETE requieren rol
administrador. Un estudiante puede consultar y recibe 403 si intenta escribir.

| Método | Ruta | Parámetros o cuerpo | Respuesta exitosa | Errores previstos |
| --- | --- | --- | --- | --- |
| GET | /cursos | semestre opcional en query | 200, arreglo ordenado por id | 400 si el filtro es inválido, 401 |
| GET | /cursos/:id | id entero positivo | 200, objeto de curso | 400, 401, 404 |
| POST | /cursos | JSON completo sin id | 201, curso y Location: /cursos/id | 400, 401, 403, 409 |
| PUT | /cursos/:id | id y JSON completo sin id | 200, curso actualizado | 400, 401, 403, 404, 409 |
| DELETE | /cursos/:id | id entero positivo | 204, cuerpo vacío | 400, 401, 403, 404 |

El ID debe contener únicamente dígitos y representar un entero de 1 a 2147483647.
Una consulta sin coincidencias devuelve un arreglo vacío. Un ID válido sin
registro devuelve 404. PUT exige todos los atributos del curso y conserva el ID
de la URL. El servicio también responde 400 para JSON mal formado, 413 para un
cuerpo demasiado grande y 500 ante errores internos como fallos de base de datos.

Ejemplo de cuerpo para POST o PUT. El código debe estar disponible al crear.

~~~json
{
  "codigo": "RSM201",
  "nombre": "Redes Multimedia II",
  "creditos": 3,
  "cupo": 30,
  "semestre": "2026-2"
}
~~~

Las respuestas de creación, consulta por ID y actualización contienen esos cinco
campos y el id generado. El listado devuelve un arreglo de esos objetos. El ID
concreto depende de la base de datos.

Los errores utilizan mensaje y, cuando existe información de validación, detalles.
Ejemplo de una respuesta de validación con HTTP 400.

~~~json
{
  "mensaje": "Datos del curso inválidos",
  "detalles": ["creditos debe ser un entero entre 1 y 6"]
}
~~~

## Validaciones y filtro

| Campo | Regla del código actual |
| --- | --- |
| codigo | Cadena obligatoria, hasta 30 caracteres después de trim. Debe ser única. Los duplicados devuelven 409. |
| nombre | Cadena obligatoria, hasta 120 caracteres después de trim. |
| creditos | Número entero entre 1 y 6, inclusive. |
| cupo | Número entero positivo, máximo 2147483647. |
| semestre | Cadena con cuatro dígitos, guion y 1 o 2, como 2026-1 o 2026-2. |

El modelo aplica trim a codigo, nombre y semestre antes de guardarlos. Los campos
numéricos se envían como números JSON. La validación de codigo impone presencia,
longitud y unicidad, y admite caracteres adicionales a letras y números.
El semestre exige el formato indicado sin comprobar un rango de años.
Al actualizar, conservar el código del propio registro es válido.

~~~http
GET http://127.0.0.1:3011/cursos?semestre=2026-2
~~~

El filtro compara el semestre exacto. Un filtro vacío, un formato distinto o varios
valores para semestre devuelve 400. En la query se exige el formato directamente,
mientras que el cuerpo de POST/PUT admite espacios exteriores que se eliminan.

## Autenticación y pruebas manuales con Postman

1. Tener MySQL, la tabla cursos y ambos servicios locales disponibles, o acceso al
   Usuarios existente con la misma clave JWT configurada en Cursos.
2. En un environment privado de Postman, definir cursos_url como
   http://127.0.0.1:3011 y usuarios_url como http://127.0.0.1:3001 para el recorrido local.
   Definir email y password con una cuenta vigente, y token para el JWT recibido.
   Estas variables se crean en Postman. El repositorio no incluye una colección
   ni un environment exportados para Cursos.
3. Enviar POST {{usuarios_url}}/usuarios/login con Content-Type: application/json
   y el cuerpo siguiente, reemplazando localmente los valores indicados.

~~~json
{"email":"<CORREO_DE_LA_CUENTA>","password":"<CONTRASEÑA_PRIVADA>"}
~~~

4. Copiar el campo token de la respuesta a la variable privada token. En las
   peticiones de Cursos, seleccionar Authorization, Bearer Token, con {{token}}.
5. Enviar GET {{cursos_url}}/health, GET {{cursos_url}}/cursos y el filtro por
   semestre. Health espera 200 público. Los listados autenticados esperan 200.
6. Con administrador, crear un curso con código disponible, guardar su ID, consultar
   ese ID, actualizarlo con el cuerpo completo y eliminar únicamente el registro de
   prueba. Esperar 201, 200, 200 y 204. Consultar el ID eliminado debe producir 404.
7. Revisar entradas inválidas con 400 y código duplicado con 409. Un curso inexistente
   produce 404 al consultar, actualizar o eliminar. Una petición protegida sin token
   o con token inválido o vencido debe dar 401.
8. Iniciar sesión con estudiante, verificar GET 200 e intentar POST, PUT o DELETE
   con ese token para comprobar 403. Revisar Test Results si se añaden aserciones.

Estos son procedimientos y resultados esperados. Esta revisión documental no
realiza una nueva corrida ni atribuye cifras de pruebas aprobadas. El script
npm test actual imprime el mensaje inicial de prueba pendiente y termina con
código 1. Las pruebas descritas se ejecutan manualmente en Postman.
