-- ==========================================================
-- PROYECTO: GESTIÓN DE TIENDA VIRTUAL
-- ASIGNATURA: BASES DE DATOS
-- AUTOR: Stiven Cuesta
-- MOTOR: PostgreSQL (Supabase)
-- ==========================================================

-- ╔══════════════════════════════════════════════════════════╗
-- ║  UNIDAD 1 — DDL: DEFINICIÓN DE DATOS                    ║
-- ╚══════════════════════════════════════════════════════════╝

-- 1.1 Creación de tablas con restricciones

-- Tabla de Categorías
CREATE TABLE categorias (
    id          SERIAL       PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activa      BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Clientes
CREATE TABLE clientes (
    id        SERIAL       PRIMARY KEY,
    nombre    VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono  VARCHAR(20),
    email     VARCHAR(100) UNIQUE NOT NULL,
    ciudad    VARCHAR(80)  DEFAULT 'Bogotá',
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Empleados
CREATE TABLE empleados (
    id             SERIAL        PRIMARY KEY,
    nombre         VARCHAR(150)  NOT NULL,
    rol            VARCHAR(50)   NOT NULL CHECK (rol IN ('Gerente','Vendedor','Almacenista','Soporte')),
    salario        NUMERIC(12,2) NOT NULL CHECK (salario > 0),
    fecha_ingreso  DATE          DEFAULT CURRENT_DATE,
    activo         BOOLEAN       DEFAULT TRUE
);

-- Tabla de Productos
CREATE TABLE productos (
    id            SERIAL        PRIMARY KEY,
    nombre        VARCHAR(150)  NOT NULL,
    descripcion   TEXT,
    precio        NUMERIC(12,2) NOT NULL CHECK (precio > 0),
    stock         INT           DEFAULT 0 CHECK (stock >= 0),
    categoria_id  INT           REFERENCES categorias(id) ON DELETE SET NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pedidos
CREATE TABLE pedidos (
    id            SERIAL        PRIMARY KEY,
    cliente_id    INT           NOT NULL REFERENCES clientes(id),
    empleado_id   INT           NOT NULL REFERENCES empleados(id),
    fecha_pedido  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    total         NUMERIC(12,2) DEFAULT 0,
    estado        VARCHAR(20)   DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Procesando','Enviado','Entregado','Cancelado'))
);

-- Tabla de Detalle de Pedidos (relación N:M entre pedidos y productos)
CREATE TABLE detalle_pedidos (
    id               SERIAL        PRIMARY KEY,
    pedido_id        INT           NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id      INT           NOT NULL REFERENCES productos(id),
    cantidad         INT           NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(12,2) NOT NULL
);

-- 1.2 ALTER TABLE — Modificaciones estructurales
ALTER TABLE clientes ADD COLUMN fecha_registro DATE DEFAULT CURRENT_DATE;
ALTER TABLE productos ADD COLUMN imagen_url TEXT;
ALTER TABLE empleados ADD COLUMN email VARCHAR(100);

-- ╔══════════════════════════════════════════════════════════╗
-- ║  UNIDAD 2 — DML: MANIPULACIÓN DE DATOS                  ║
-- ╚══════════════════════════════════════════════════════════╝

-- 2.1 INSERT — Inserción de datos

INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónica',    'Dispositivos y gadgets tecnológicos'),
('Muebles',        'Mobiliario para hogar y oficina'),
('Ropa',           'Prendas de vestir y accesorios'),
('Deportes',       'Artículos deportivos y fitness'),
('Hogar',          'Electrodomésticos y utensilios del hogar');

INSERT INTO clientes (nombre, email, telefono, direccion, ciudad) VALUES
('Juan Pérez',     'juan@correo.com',    '3001234567', 'Cra 15 # 45-20',  'Bogotá'),
('María López',    'maria@correo.com',   '3109876543', 'Cll 80 # 12-05',  'Medellín'),
('Carlos Gómez',   'carlos@correo.com',  '3201112233', 'Av 30 # 5-10',    'Cali'),
('Ana Martínez',   'ana@correo.com',     '3154445566', 'Cra 7 # 22-18',   'Bogotá'),
('Pedro Rodríguez','pedro@correo.com',   '3187778899', 'Cll 50 # 8-30',   'Barranquilla');

INSERT INTO empleados (nombre, rol, salario, email) VALUES
('Carlos Admin',     'Gerente',      4500.00, 'cadmin@tienda.com'),
('Ana Ventas',       'Vendedor',     2000.00, 'aventas@tienda.com'),
('Luis Bodega',      'Almacenista',  1800.00, 'lbodega@tienda.com'),
('Sandra Soporte',   'Soporte',      2200.00, 'ssoporte@tienda.com');

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
('MacBook Pro 14"',     'Laptop Apple M3 Pro 18GB',            2500.00, 15, 1),
('iPhone 15 Pro',       'Smartphone Apple A17 Pro 256GB',      1200.00, 42, 1),
('Silla Gamer RGB',     'Silla ergonómica con luces LED',       350.00,  8, 2),
('Escritorio Standing', 'Escritorio ajustable eléctrico',       580.00, 12, 2),
('Camiseta Dry-Fit',    'Camiseta deportiva transpirable',       45.00, 100, 3),
('Tenis Running Pro',   'Zapatillas amortiguación premium',     180.00, 35, 4),
('Licuadora Power',     'Licuadora 1200W con vaso de vidrio',    95.00, 28, 5),
('AirPods Pro 2',       'Auriculares inalámbricos con ANC',     250.00, 60, 1),
('Chaqueta Impermeable','Chaqueta resistente al agua',          120.00, 20, 3),
('Mancuernas 20kg',     'Par de mancuernas hexagonales',         85.00, 40, 4);

-- Insertar pedidos y sus detalles
INSERT INTO pedidos (cliente_id, empleado_id, total, estado) VALUES
(1, 2, 3700.00, 'Entregado'),
(2, 2, 1200.00, 'Enviado'),
(3, 1,  530.00, 'Procesando'),
(4, 2,  430.00, 'Pendiente'),
(1, 1, 1450.00, 'Entregado');

INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 2500.00),   -- Pedido 1: MacBook
(1, 2, 1, 1200.00),   -- Pedido 1: iPhone
(2, 2, 1, 1200.00),   -- Pedido 2: iPhone
(3, 6, 2,  180.00),   -- Pedido 3: 2x Tenis
(3, 5, 1,   45.00),   -- Pedido 3: Camiseta (pendiente sumar descuento simulado)
(4, 5, 2,   45.00),   -- Pedido 4: 2x Camiseta
(4, 10,2,   85.00),   -- Pedido 4: 2x Mancuernas (se ajustará en transacción)
(5, 8, 1,  250.00),   -- Pedido 5: AirPods
(5, 2, 1, 1200.00);   -- Pedido 5: iPhone

-- 2.2 UPDATE — Actualización de datos
UPDATE productos SET precio = 2400.00 WHERE nombre = 'MacBook Pro 14"';
UPDATE clientes  SET ciudad = 'Cartagena' WHERE nombre = 'Pedro Rodríguez';
UPDATE pedidos   SET estado = 'Entregado' WHERE id = 3;

-- 2.3 DELETE — Eliminación de datos (con precaución)
-- DELETE FROM detalle_pedidos WHERE pedido_id = 4 AND producto_id = 10;

-- ╔══════════════════════════════════════════════════════════╗
-- ║  UNIDAD 3 — CONSULTAS AVANZADAS                          ║
-- ╚══════════════════════════════════════════════════════════╝

-- 3.1 INNER JOIN — Pedidos con info completa
SELECT
    p.id        AS pedido_id,
    c.nombre    AS cliente,
    e.nombre    AS vendedor,
    p.total,
    p.estado,
    p.fecha_pedido
FROM pedidos p
INNER JOIN clientes c  ON p.cliente_id  = c.id
INNER JOIN empleados e ON p.empleado_id = e.id
ORDER BY p.fecha_pedido DESC;

-- 3.2 LEFT JOIN — Productos con o sin categoría
SELECT
    pr.nombre   AS producto,
    pr.precio,
    pr.stock,
    COALESCE(cat.nombre, 'Sin categoría') AS categoria
FROM productos pr
LEFT JOIN categorias cat ON pr.categoria_id = cat.id
ORDER BY pr.precio DESC;

-- 3.3 Subconsulta — Clientes con pedidos superiores al promedio
SELECT nombre, email
FROM clientes
WHERE id IN (
    SELECT cliente_id
    FROM pedidos
    WHERE total > (SELECT AVG(total) FROM pedidos)
);

-- 3.4 GROUP BY + HAVING — Categorías con más de 2 productos
SELECT
    cat.nombre AS categoria,
    COUNT(pr.id) AS total_productos,
    AVG(pr.precio) AS precio_promedio
FROM productos pr
JOIN categorias cat ON pr.categoria_id = cat.id
GROUP BY cat.nombre
HAVING COUNT(pr.id) >= 2
ORDER BY total_productos DESC;

-- 3.5 Subconsulta correlacionada — Producto más caro por categoría
SELECT pr.nombre, pr.precio, cat.nombre AS categoria
FROM productos pr
JOIN categorias cat ON pr.categoria_id = cat.id
WHERE pr.precio = (
    SELECT MAX(p2.precio)
    FROM productos p2
    WHERE p2.categoria_id = pr.categoria_id
);

-- 3.6 Productos más vendidos (agregación)
SELECT
    pr.nombre,
    SUM(dp.cantidad) AS unidades_vendidas,
    SUM(dp.cantidad * dp.precio_unitario) AS ingresos_totales
FROM detalle_pedidos dp
JOIN productos pr ON dp.producto_id = pr.id
GROUP BY pr.nombre
ORDER BY unidades_vendidas DESC;

-- ╔══════════════════════════════════════════════════════════╗
-- ║  UNIDAD 4 — VISTAS E ÍNDICES                            ║
-- ╚══════════════════════════════════════════════════════════╝

-- 4.1 Vista: Resumen de ventas
CREATE OR REPLACE VIEW v_resumen_ventas AS
SELECT
    p.id            AS pedido_id,
    c.nombre        AS cliente,
    c.email         AS email_cliente,
    e.nombre        AS vendedor,
    p.total,
    p.estado,
    p.fecha_pedido
FROM pedidos p
JOIN clientes c  ON p.cliente_id  = c.id
JOIN empleados e ON p.empleado_id = e.id;

-- 4.2 Vista: Inventario valorizado
CREATE OR REPLACE VIEW v_inventario AS
SELECT
    pr.id,
    pr.nombre,
    cat.nombre      AS categoria,
    pr.precio,
    pr.stock,
    (pr.precio * pr.stock) AS valor_inventario
FROM productos pr
LEFT JOIN categorias cat ON pr.categoria_id = cat.id
ORDER BY valor_inventario DESC;

-- 4.3 Vista: Top clientes
CREATE OR REPLACE VIEW v_top_clientes AS
SELECT
    c.nombre,
    c.email,
    COUNT(p.id)     AS total_pedidos,
    SUM(p.total)    AS monto_total
FROM clientes c
JOIN pedidos p ON c.id = p.cliente_id
GROUP BY c.nombre, c.email
ORDER BY monto_total DESC;

-- 4.4 Índices para optimización
CREATE INDEX idx_producto_nombre     ON productos(nombre);
CREATE INDEX idx_producto_categoria  ON productos(categoria_id);
CREATE INDEX idx_pedido_cliente      ON pedidos(cliente_id);
CREATE INDEX idx_pedido_fecha        ON pedidos(fecha_pedido);
CREATE INDEX idx_detalle_pedido      ON detalle_pedidos(pedido_id);
CREATE INDEX idx_cliente_email       ON clientes(email);

-- ╔══════════════════════════════════════════════════════════╗
-- ║  UNIDAD 5 — TRANSACCIONES                                ║
-- ╚══════════════════════════════════════════════════════════╝

-- 5.1 Transacción exitosa: Crear pedido y descontar stock
BEGIN;
    -- Paso 1: Crear el pedido
    INSERT INTO pedidos (cliente_id, empleado_id, total, estado)
    VALUES (2, 2, 250.00, 'Pendiente');

    -- Paso 2: Registrar detalle (AirPods Pro 2)
    INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (currval('pedidos_id_seq'), 8, 1, 250.00);

    -- Paso 3: Descontar stock
    UPDATE productos SET stock = stock - 1 WHERE id = 8;

    -- Si todo salió bien:
COMMIT;

-- 5.2 Transacción con ROLLBACK: Simular error
BEGIN;
    UPDATE productos SET stock = stock - 999 WHERE id = 1;
    -- Error: el stock no puede ser negativo (CHECK constraint)
    -- La transacción se reversa:
ROLLBACK;

-- 5.3 SAVEPOINT: Punto de guardado intermedio
BEGIN;
    UPDATE productos SET precio = 2300.00 WHERE id = 1;
    SAVEPOINT precio_actualizado;

    UPDATE productos SET stock = stock + 50 WHERE id = 1;

    -- Si el stock no se debía modificar, volver al savepoint:
    ROLLBACK TO SAVEPOINT precio_actualizado;
    -- Solo se mantiene el cambio de precio
COMMIT;

-- ╔══════════════════════════════════════════════════════════╗
-- ║  UNIDAD 6 — CONTROL DE PERMISOS                         ║
-- ╚══════════════════════════════════════════════════════════╝

-- 6.1 Crear roles
CREATE ROLE gerente_tienda;
CREATE ROLE vendedor_tienda;
CREATE ROLE cliente_web;

-- 6.2 Asignar permisos al gerente (acceso total)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gerente_tienda;

-- 6.3 Asignar permisos al vendedor (lectura y escritura limitada)
GRANT SELECT, INSERT, UPDATE ON productos  TO vendedor_tienda;
GRANT SELECT, INSERT         ON pedidos    TO vendedor_tienda;
GRANT SELECT, INSERT         ON detalle_pedidos TO vendedor_tienda;
GRANT SELECT                 ON clientes   TO vendedor_tienda;
GRANT SELECT                 ON categorias TO vendedor_tienda;

-- 6.4 Asignar permisos al cliente (solo lectura de productos y categorías)
GRANT SELECT ON productos  TO cliente_web;
GRANT SELECT ON categorias TO cliente_web;

-- 6.5 Revocar permisos peligrosos
REVOKE DELETE ON clientes  FROM vendedor_tienda;
REVOKE DELETE ON empleados FROM vendedor_tienda;
REVOKE ALL    ON empleados FROM cliente_web;

-- ╔══════════════════════════════════════════════════════════╗
-- ║  ÁLGEBRA RELACIONAL (Referencia conceptual)              ║
-- ╚══════════════════════════════════════════════════════════╝

-- Selección (σ): σ_{precio > 500}(productos)
SELECT * FROM productos WHERE precio > 500;

-- Proyección (π): π_{nombre, precio}(productos)
SELECT nombre, precio FROM productos;

-- Producto cartesiano + Selección = JOIN
-- (clientes) ⋈_{clientes.id = pedidos.cliente_id} (pedidos)
SELECT c.nombre, p.total
FROM clientes c
JOIN pedidos p ON c.id = p.cliente_id;

-- Unión: Empleados y clientes como "personas"
SELECT nombre, email FROM clientes
UNION
SELECT nombre, email FROM empleados WHERE email IS NOT NULL;

-- Diferencia: Clientes sin pedidos
SELECT nombre FROM clientes
WHERE id NOT IN (SELECT DISTINCT cliente_id FROM pedidos);
