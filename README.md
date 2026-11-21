# ms-cursos-m3

Microservicio de cursos — preparación Módulo 3 — Steven Franco y Santiago Mejía.

Repositorio de preparación del parcial de Redes y Servicios Multimedia. Incluye
la API de Cursos y una copia del servicio común de Usuarios entregado por la
profesora, reutilizado desde MediRed para autenticación JWT.

## Organización

| Carpeta | Propósito | Configuración local |
| --- | --- | --- |
| [ms-cursos](ms-cursos/README.md) | CRUD de cursos y filtro por semestre, con permisos por rol. | Puerto 3011, base cursos_db. |
| [ms-usuarios](ms-usuarios/README.md) | Usuarios, login JWT y middleware original. | Puerto 3001, base usuarios_examen_db en la copia local. |

Cada servicio contiene src/, db/schema.sql, package.json, package-lock.json y
.env.example. Las capas separan rutas, controlador, servicio, repositorio y modelo.
Los archivos .env y las carpetas node_modules/ están excluidos por .gitignore.

## Ejecución local

Requisitos compartidos para la preparación local, Node.js 22.9 o posterior,
MySQL 8 y Postman. En instalaciones nuevas de MySQL, preparar las bases, los
usuarios y sus permisos siguiendo los README de cada servicio.

1. En cada carpeta, ejecutar npm install si faltan las dependencias.
2. Copiar .env.example a .env únicamente si todavía no existe. Configurar las
   credenciales privadas de MySQL y una misma JWT_SECRET para ambos servicios.
   Conservar PORT=3001 en Usuarios y PORT=3011 en Cursos.
3. Crear las bases e importar sus esquemas una sola vez en la instalación local.
   El esquema de Cursos selecciona cursos_db. Para Usuarios, seleccionar
   usuarios_examen_db antes de importar su esquema.
4. Abrir dos terminales desde la raíz del repositorio.

Terminal de Usuarios.

~~~powershell
cd ms-usuarios
npm run dev
~~~

Terminal de Cursos.

~~~powershell
cd ms-cursos
npm run dev
~~~

En Postman, consultar GET http://127.0.0.1:3001/health y
GET http://127.0.0.1:3011/health. Ambos son públicos y esperan 200 con servicio y
estado. Para verificar el acceso a Cursos, iniciar sesión en Usuarios y enviar el
JWT recibido como Bearer en GET http://127.0.0.1:3011/cursos.

La salud de Usuarios comprueba la respuesta HTTP del proceso. Cursos verifica la
conexión MySQL con SELECT 1 antes de escuchar, aunque /health por sí solo tampoco
comprueba la existencia de las tablas. El listado autenticado permite revisar el
acceso a la tabla cursos. Los resultados se registran al ejecutar las pruebas.

## Colección Postman

Importar en Postman el archivo
[docs/M3-Preparacion-ms-cursos.postman_collection.json](docs/M3-Preparacion-ms-cursos.postman_collection.json).
La colección **M3 - Preparación - ms-cursos** contiene 14 peticiones para enviar
manualmente con **Send**, sin ambientes ni scripts automáticos.

Completar las credenciales en las variables de la colección. Copiar los JWT de
los logins a tokenAdmin y tokenEstudiante. Crear el curso con 04 antes de consultar
con 03 y copiar su ID a cursoId para consultar, actualizar y eliminar únicamente
ese registro de prueba. La [guía de Cursos](ms-cursos/README.md#autenticación-y-pruebas-manuales-con-postman)
detalla el recorrido y los códigos HTTP esperados.

## Reutilización en las máquinas virtuales

ms-usuarios ya está desplegado en svrBog2, puerto 3001. Se reutiliza conservando
su código, administrador inicial y configuración de base de datos. Para el
parcial, su variable ROLES debe conservar los roles existentes y agregar estudiante.

~~~env
ROLES=administrador,admisiones,medico,estudiante
~~~

El cambio se aplica cuando el servicio vuelve a cargar su configuración. El rol
se habilita para validar cuentas, y cada microservicio mantiene sus permisos de
rutas. Configurar en Cursos la misma JWT_SECRET por un medio privado.
El acceso desde Postman debe usar el endpoint alcanzable de esa instalación,
por ejemplo el Gateway existente http://app.medired.com/api/usuarios/login cuando
esté disponible. El puerto 3001 puede estar limitado a loopback en svrBog2.

Esta preparación contempla reutilizar la instancia existente de Usuarios. El
README de la copia describe también su uso local para desarrollo.

**ms-cursos debe permanecer sin desplegar en las máquinas virtuales antes del examen.**

## Pendientes para el examen

- Verificar en la instancia existente de Usuarios la configuración de los cuatro
  roles y preparar las cuentas necesarias con un administrador autorizado.
- Durante el examen, preparar en las VMs la base y permisos de Cursos, su .env
  privado, el arranque del proceso y la publicación o el proxy que se solicite.
- Desplegar ms-cursos únicamente cuando corresponda en el examen y verificar las
  rutas, autenticación, permisos, filtro y persistencia del despliegue.
- Registrar las evidencias reales y sus resultados en Postman.

Estas tareas quedan pendientes de ejecución y verificación en ese entorno.
La configuración del proxy para /cursos queda por preparar si se solicita durante
el examen. La colección Postman ya está disponible en docs/ para pruebas locales.
El script npm test de Cursos es el marcador inicial que termina con error. La
verificación HTTP se realiza manualmente con la colección.
