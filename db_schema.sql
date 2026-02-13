
-- Estructura de la Base de Datos para Gastoxpress
CREATE DATABASE IF NOT EXISTS gastoxpress;
USE gastoxpress;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    tipo ENUM('INCOME', 'EXPENSE') NOT NULL,
    categoria VARCHAR(100),
    fecha DATE NOT NULL,
    usuario_id INT DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Datos de prueba iniciales
INSERT INTO usuarios (nombre, email, password) VALUES ('Admin', 'admin@gastoxpress.com', '123456789');
