-- ==========================================================
-- PROYECTO: GESTIÓN DE TIENDA VIRTUAL
-- ASIGNATURA: BASES DE DATOS
-- ==========================================================

-- 1. DDL: CREACIÓN DE ESTRUCTURAS (TABLAS)
-- ----------------------------------------------------------

-- Tabla de Categorías
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla de Clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Tabla de Empleados
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(50),
    salario NUMERIC(12, 2),
    fecha_ingreso DATE DEFAULT CURRENT_DATE
);

-- Tabla de Productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL,
    stock INT DEFAULT 0,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabla de Pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id),
    empleado_id INT REFERENCES empleados(id),
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) DEFAULT 0
);

-- Detalle de Pedidos (N:M relation)
CREATE TABLE detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL
);

-- 2. DML: MANIPULACIÓN DE DATOS (INSERCIONES)
-- ----------------------------------------------------------

INSERT INTO categorias (nombre, descripcion) VALUES 
('Electrónica', 'Dispositivos y gadgets tecnológicos'),
('Muebles', 'Mobiliario para hogar y oficina');

INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES 
('MacBook Pro', 2500.00, 15, 1),
('iPhone 15', 1200.00, 42, 1),
('Silla Gamer', 350.00, 8, 2);

INSERT INTO clientes (nombre, email, telefono) VALUES 
('Juan Pérez', 'juan@test.com', '3001234567'),
('María López', 'maria@test.com', '3109876543');

INSERT INTO empleados (nombre, rol, salario) VALUES 
('Carlos Admin', 'Gerente', 4500.00),
('Ana Ventas', 'Vendedor', 2000.00);

-- 3. CONSULTAS AVANZADAS (JOIN, VISTAS, ÍNDICES)
-- ----------------------------------------------------------

-- Vista para reporte de ventas
CREATE VIEW v_resumen_ventas AS
SELECT 
    p.id AS pedido_id,
    c.nombre AS cliente,
    e.nombre AS vendedor,
    p.total,
    p.fecha_pedido
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
JOIN empleados e ON p.empleado_id = e.id;

-- Índice para búsqueda rápida de productos por nombre
CREATE INDEX idx_producto_nombre ON productos(nombre);

-- Consulta compleja: Productos más vendidos
SELECT 
    pr.nombre,
    SUM(dp.cantidad) as total_vendido
FROM detalle_pedidos dp
JOIN productos pr ON dp.producto_id = pr.id
GROUP BY pr.nombre
ORDER BY total_vendido DESC;

-- 4. CONTROL DE TRANSACCIONES Y PERMISOS
-- ----------------------------------------------------------

-- Ejemplo de Transacción para realizar un pedido y descontar stock
BEGIN;
    INSERT INTO pedidos (cliente_id, empleado_id, total) VALUES (1, 2, 2500.00);
    UPDATE productos SET stock = stock - 1 WHERE id = 1;
COMMIT; -- Si algo falla, usar ROLLBACK;

-- Control de Permisos
GRANT SELECT, INSERT ON productos TO empleado_ventas;
REVOKE DELETE ON clientes FROM empleado_ventas;
