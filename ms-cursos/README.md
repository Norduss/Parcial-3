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

La colección [M3-Preparacion-ms-cursos.postman_collection.json](../docs/M3-Preparacion-ms-cursos.postman_collection.json)
está en docs/ de la raíz del repositorio. Contiene 14 peticiones y se utiliza
manualmente, sin ambientes, scripts previos, scripts posteriores ni aserciones
automáticas. Los códigos esperados aparecen en la descripción de cada petición.

1. Tener disponibles MySQL, la tabla cursos y los servicios locales de Usuarios
   en http://127.0.0.1:3001 y Cursos en http://127.0.0.1:3011, con la misma JWT_SECRET.
2. En Postman, pulsar **Import**, seleccionar el JSON y abrir la colección
   **M3 - Preparación - ms-cursos**. Mantener **No environment** seleccionado.
3. En **Variables** de la colección, revisar adminEmail y estudianteEmail y
   completar adminPassword y estudiantePassword localmente. Las cuentas deben
   existir, estar activas y tener rol administrador y estudiante, respectivamente.
   usuariosUrl y cursosUrl ya contienen las direcciones locales indicadas.
4. Enviar **01 - Login administrador** con **Send** y copiar el campo token de
   la respuesta a tokenAdmin en las variables de la colección. El login espera 200.
5. Enviar **02 - Listar cursos**. Después enviar **04 - Crear curso**, usando
   codigoPrueba disponible, y copiar el id recibido a cursoId. El valor inicial
   de codigoPrueba es M3-PRUEBA-001. Revisar ese código antes de repetir una creación.
6. Enviar **03 - Consultar curso por ID**, **05 - Actualizar curso** y
   **06 - Eliminar curso**, conservando el ID del curso creado en 04. Los códigos
   esperados son 200, 200 y 204. Mantener cursoId con ese ID para que **08 - Curso
   inexistente** consulte el registro eliminado y espere 404. Los tres cursos
   iniciales se conservan.
7. Enviar **07 - Datos inválidos** para comprobar 400 y **09 - Código duplicado**
   para comprobar 409. codigoDuplicado parte de RSM101 y debe corresponder a un
   curso existente en el listado. Enviar **10 - Filtrar por semestre** para esperar
   200. semestre parte de 2026-2 y debe tener formato AAAA-1 o AAAA-2.
8. Enviar **11 - Login estudiante** y copiar el token recibido a tokenEstudiante.
   Después enviar **12 - Consultar cursos como estudiante**, que espera 200, y
   **13 - Crear curso como estudiante**, que espera 403.
9. Enviar **14 - Consultar cursos sin token**, configurada con **No Auth**, para
   comprobar 401. Los GET protegidos requieren JWT válido y las escrituras
   requieren administrador. Las peticiones ya tienen configurado el Bearer
   correspondiente a tokenAdmin o tokenEstudiante.

El orden manual recomendado es **01, 02, 04, 03, 05, 06, 07, 08, 09, 10, 11, 12,
13 y 14**. Actualizar las variables manualmente cuando cambien los tokens o el ID.
Revisar el estado HTTP recibido tras cada envío. Al carecer de aserciones, una
indicación **No tests found** corresponde a una petición sin pruebas automáticas.
Conservar las contraseñas y JWT como valores privados en Postman y vaciarlos antes
de compartir o exportar la colección.

ms-usuarios ya está desplegado en svrBog2, puerto 3001, y se reutilizará en las VMs.
**ms-cursos se desplegará en las máquinas virtuales únicamente durante el examen.**
Las URLs de la colección corresponden a la preparación local actual.

Los códigos descritos son resultados esperados. Esta actualización documental no
realiza una nueva ejecución ni atribuye cifras de pruebas aprobadas. El script
npm test actual imprime el mensaje inicial de prueba pendiente y termina con
código 1. La comprobación HTTP se realiza mediante los envíos manuales indicados.
