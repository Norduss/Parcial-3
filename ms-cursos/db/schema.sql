SET NAMES utf8mb4;

USE cursos_db;

CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    creditos INT NOT NULL,
    cupo INT NOT NULL,
    semestre VARCHAR(6) NOT NULL,
    salon_id INT NOT NULL,
    CONSTRAINT uq_cursos_codigo UNIQUE (codigo),
    CONSTRAINT chk_cursos_creditos CHECK (creditos BETWEEN 1 AND 6),
    CONSTRAINT chk_cursos_cupo CHECK (cupo > 0),
    CONSTRAINT chk_cursos_salon CHECK (salon_id > 0),
    CONSTRAINT chk_cursos_semestre
        CHECK (semestre REGEXP '^[0-9]{4}-[12]$')
);

INSERT INTO cursos (codigo, nombre, creditos, cupo, semestre, salon_id)
VALUES
    ('RSM101', 'Redes y Servicios Multimedia', 3, 30, '2026-2', 1),
    ('PROG101', 'Programación I', 4, 25, '2026-1', 2),
    ('BD101', 'Bases de Datos', 3, 20, '2026-2', 3);
