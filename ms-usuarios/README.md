# ms-usuarios · versión completa (Módulo 3)

Redes y Servicios Multimedia · UAO. Microservicio común de todos los grupos:
gestiona los usuarios de la aplicación, guarda las contraseñas cifradas (bcrypt)
y entrega tokens JWT al iniciar sesión. **Nadie del grupo lo modifica**: se configura con su `.env`.

Esta guía conserva el contenido técnico de la documentación de Usuarios de MediRed,
adaptando la preparación local a usuarios_examen_db y documentando su reutilización
para el parcial. El código y el administrador inicial se conservan.

## Cómo ejecutarlo localmente

Requisitos: Node.js 22.9 o superior y MySQL 8.

1. Crear la base de datos y su usuario (como root, en MySQL Workbench o la consola):

```sql
CREATE DATABASE usuarios_examen_db;
CREATE USER 'usuarios_examen_user'@'localhost' IDENTIFIED BY '<CLAVE_PRIVADA>';
GRANT ALL PRIVILEGES ON usuarios_examen_db.* TO 'usuarios_examen_user'@'localhost';
```

2. Seleccionar usuarios_examen_db con USE usuarios_examen_db; y crear la tabla con `db/schema.sql` (Workbench: File → Open SQL Script, o en la consola `SOURCE db/schema.sql;`).
3. `npm install`
4. Copiar `.env.example` como `.env` y ajustar los roles de su empresa y el `JWT_SECRET` del grupo.
5. `npm run dev`

Usuario inicial: admin@empresa.com (rol administrador). Utilizar la credencial entregada por la profesora o la vigente en la instalación.

## Endpoints

| Método | URI | Quién | Respuesta exitosa | Errores |
|---|---|---|---|---|
| GET | /health | Público | 200 | — |
| POST | /usuarios/login | Público | 200 `{ token, usuario }` | 401 email o contraseña incorrectos |
| GET | /usuarios | administrador | 200 arreglo (filtros `?rol=` y `?ids=`) | 401 · 403 |
| GET | /usuarios/me | Cualquier rol | 200 los datos del dueño del token | 401 |
| GET | /usuarios/:id | administrador, o el propio usuario | 200 usuario | 400 · 401 · 403 · 404 |
| POST | /usuarios | administrador | 201 usuario + Location | 400 · 401 · 403 · 409 |
| PUT | /usuarios/:id | administrador | 200 usuario | 400 · 401 · 403 · 404 · 409 |
| DELETE | /usuarios/:id | administrador | 204 | 400 · 401 · 403 · 404 |

Un usuario que no es administrador solo puede consultar su propio registro (`/usuarios/me` o `/usuarios/<su id>`); el resto de operaciones son del administrador.

`password` se envía al crear (mínimo 8 caracteres) y es opcional al actualizar.
**Nunca aparece en una respuesta.**

## El token

`POST /usuarios/login` con `{"email": "...", "password": "..."}` responde:

```json
{ "token": "<TOKEN_JWT>", "usuario": { "id": 1, "nombre": "...", "email": "...", "rol": "administrador", "activo": true } }
```

Las demás peticiones, en este y en todos los microservicios del grupo, envían la cabecera
`Authorization: Bearer <token>`. El token lleva `{ id, nombre, rol }`, vence según `JWT_EXPIRA`
y se verifica con `JWT_SECRET`, que debe ser **la misma en todos los microservicios del grupo**.

## El middleware para los demás microservicios

`src/middlewares/auth.js` se copia **sin cambios** a cada microservicio del grupo
(junto con `npm install jsonwebtoken`). Ofrece:

- `verificarToken`: exige un token válido → 401 si falta, es inválido o venció.
- `requiereRol('rol1', 'rol2')`: deja pasar solo esos roles → 403 a los demás.

## CORS (frontend en su PC)

ms-usuarios tiene CORS activo (`app.use(cors())` en `src/app.js`). Así, un frontend abierto
en el navegador desde otra dirección (doble clic en el HTML, o Live Server en otro puerto)
puede llamar a `http://localhost:3001`. Sin CORS, el navegador bloquea la respuesta y en la
consola aparece *blocked by CORS policy*.

Para conectar las pantallas de su entidad con su propio microservicio, hagan lo mismo en él:
`npm install cors` y `app.use(cors());` antes de `app.use(express.json());`.

En el Taller 3, detrás del gateway, el frontend y la API comparten dirección y CORS ya no hace falta.

## Configuración para el parcial y reutilización de svrBog2

Para las VMs se puede utilizar el ms-usuarios que ya está desplegado en svrBog2,
puerto 3001. La preparación prevista reutiliza esa instancia y su base actual.
La base usuarios_examen_db corresponde a la copia local de este repositorio.

Conservar los roles existentes y agregar estudiante en la variable ROLES del .env
de la instancia que se utilice, coordinando el cambio con el responsable.

~~~env
ROLES=administrador,admisiones,medico,estudiante
~~~

El modelo obtiene los roles permitidos desde esa variable. La configuración
requiere volver a cargar el proceso para aplicarse. El cambio permite validar
cuentas con esos roles. Crear la cuenta estudiante requiere un administrador y
no concede permisos de administrador al estudiante.

La actualización de la instancia desplegada queda pendiente de comprobar durante
la preparación autorizada del examen. Esta revisión documenta el procedimiento.
Para obtener un JWT, utilizar el endpoint alcanzable de esa instancia. Si el
puerto 3001 está limitado a loopback en svrBog2, utilizar el Gateway existente
http://app.medired.com/api/usuarios/login cuando esté disponible.

| Variable de la copia local | Propósito |
| --- | --- |
| PORT, HOST | 3001 y 127.0.0.1. Configurar PORT explícitamente, pues src/index.js utiliza 3000 como respaldo si falta. |
| DB_HOST, DB_PORT | Servidor MySQL y puerto 3306, según la instalación. |
| DB_NAME | usuarios_examen_db para el desarrollo local. |
| DB_USER, DB_PASSWORD | Cuenta de la base local y su contraseña privada. |
| JWT_SECRET | Clave privada compartida con ms-cursos. |
| JWT_EXPIRA | Vigencia del token, 8h como valor de respaldo. |
| ROLES | administrador,admisiones,medico,estudiante. |

El [.env.example](.env.example) incluye los cuatro roles. Revisar el .env vigente
antes de ejecutar, ya que copiar el ejemplo no actualiza un archivo existente.
No sobrescribir credenciales privadas. .env y node_modules/ están excluidos de Git.

El [esquema original](db/schema.sql) crea la tabla y el administrador inicial,
con contraseña almacenada mediante bcrypt. Importarlo únicamente en una base
local nueva seleccionada previamente. Conservar la base y cuentas existentes
en svrBog2 cuando se reutilice su servicio.

El login valida la contraseña y la cuenta activa. Devuelve token y usuario sin
password_hash. Todos los roles pueden consultar /usuarios/me y su propio ID.
Listar usuarios y realizar POST, PUT o DELETE requiere administrador. En Cursos,
los usuarios autenticados pueden hacer GET y las escrituras requieren administrador.

La configuración actual de Cursos utiliza Postman para pruebas y carece de
middleware CORS. La explicación de CORS de la guía original corresponde a su
integración con un frontend en navegador. Para ejecutar el recorrido local,
consultar también la [guía de Cursos](../ms-cursos/README.md).
