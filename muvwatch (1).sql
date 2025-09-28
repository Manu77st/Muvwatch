-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-09-2025 a las 21:39:16
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `muvwatch`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conversaciones_chatbot`
--

CREATE TABLE `conversaciones_chatbot` (
  `id_conversacion` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `mensaje_usuario` text NOT NULL,
  `respuesta_chatbot` text NOT NULL,
  `tipo_respuesta` enum('recomendacion','compra','seleccion_silla','general') NOT NULL,
  `fecha_conversacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `conversaciones_chatbot`
--

INSERT INTO `conversaciones_chatbot` (`id_conversacion`, `id_cliente`, `mensaje_usuario`, `respuesta_chatbot`, `tipo_respuesta`, `fecha_conversacion`) VALUES
(1, 1, '¿Qué películas hay disponibles?', 'Tenemos disponible Inception en Sala 1.', 'recomendacion', '2025-09-11 01:15:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalles_reserva`
--

CREATE TABLE `detalles_reserva` (
  `id_detalle` int(11) NOT NULL,
  `id_reserva` int(11) NOT NULL,
  `id_silla` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalles_reserva`
--

INSERT INTO `detalles_reserva` (`id_detalle`, `id_reserva`, `id_silla`) VALUES
(1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalles_venta`
--

CREATE TABLE `detalles_venta` (
  `id_detalle` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_silla` int(11) NOT NULL,
  `precio_silla` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalles_venta`
--

INSERT INTO `detalles_venta` (`id_detalle`, `id_venta`, `id_silla`, `precio_silla`) VALUES
(1, 1, 1, 15000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs_actividad`
--

CREATE TABLE `logs_actividad` (
  `id_log` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_accion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `logs_actividad`
--

INSERT INTO `logs_actividad` (`id_log`, `id_usuario`, `accion`, `descripcion`, `fecha_accion`) VALUES
(1, 1, 'Reserva creada', 'El cliente realizó una reserva para la función de Inception.', '2025-09-11 01:15:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_admins`
--

CREATE TABLE `tbl_admins` (
  `id_admin` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_admins`
--

INSERT INTO `tbl_admins` (`id_admin`) VALUES
(3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_bloquesillas`
--

CREATE TABLE `tbl_bloquesillas` (
  `id_bloque` int(11) NOT NULL,
  `id_sala` int(11) NOT NULL,
  `nombre_bloque` varchar(50) NOT NULL,
  `filas` varchar(1) NOT NULL,
  `sillas_fila` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_bloquesillas`
--

INSERT INTO `tbl_bloquesillas` (`id_bloque`, `id_sala`, `nombre_bloque`, `filas`, `sillas_fila`) VALUES
(1, 1, 'Bloque A', 'A', 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_cajeros`
--

CREATE TABLE `tbl_cajeros` (
  `id_cajero` int(11) NOT NULL,
  `cod_empleado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_cajeros`
--

INSERT INTO `tbl_cajeros` (`id_cajero`, `cod_empleado`) VALUES
(2, 'EMP001');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_clientes`
--

CREATE TABLE `tbl_clientes` (
  `id_cliente` int(11) NOT NULL,
  `cliente_vip` tinyint(1) DEFAULT 0,
  `porcentaje_descuento` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_clientes`
--

INSERT INTO `tbl_clientes` (`id_cliente`, `cliente_vip`, `porcentaje_descuento`) VALUES
(1, 1, 15.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_funcion`
--

CREATE TABLE `tbl_funcion` (
  `id_funcion` int(11) NOT NULL,
  `id_pelicula` int(11) NOT NULL,
  `id_sala` int(11) NOT NULL,
  `fecha_funcion` date NOT NULL,
  `precio` decimal(8,2) NOT NULL,
  `descuento` decimal(8,2) NOT NULL,
  `activa` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_funcion`
--

INSERT INTO `tbl_funcion` (`id_funcion`, `id_pelicula`, `id_sala`, `fecha_funcion`, `precio`, `descuento`, `activa`) VALUES
(1, 1, 1, '2025-09-15', 15000.00, 2000.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_pelicula`
--

CREATE TABLE `tbl_pelicula` (
  `id_pelicula` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `sipnosis` text NOT NULL,
  `clasificacion` varchar(20) NOT NULL,
  `genero` varchar(20) NOT NULL,
  `reparto` varchar(100) NOT NULL,
  `director` varchar(100) NOT NULL,
  `duracion` int(11) NOT NULL,
  `fecha_estreno` date DEFAULT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_pelicula`
--

INSERT INTO `tbl_pelicula` (`id_pelicula`, `nombre`, `sipnosis`, `clasificacion`, `genero`, `reparto`, `director`, `duracion`, `fecha_estreno`, `activa`, `fecha_creacion`) VALUES
(1, 'Inception', 'Un ladrón que roba secretos a través de sueños.', 'PG-13', 'Ciencia Ficción', 'Leonardo DiCaprio, Joseph Gordon-Levitt', 'Christopher Nolan', 148, '2010-07-16', 1, '2025-09-11 01:15:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_reservas`
--

CREATE TABLE `tbl_reservas` (
  `id_reserva` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_funcion` int(11) NOT NULL,
  `fecha_reserva` date NOT NULL,
  `hora` time NOT NULL,
  `fecha_expiracion` datetime NOT NULL,
  `estado` enum('activa','expirada','convertida','cancelada') DEFAULT 'activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_reservas`
--

INSERT INTO `tbl_reservas` (`id_reserva`, `id_cliente`, `id_funcion`, `fecha_reserva`, `hora`, `fecha_expiracion`, `estado`) VALUES
(1, 1, 1, '2025-09-10', '18:30:00', '2025-09-10 20:00:00', 'activa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_salas`
--

CREATE TABLE `tbl_salas` (
  `id_sala` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `capacidad` int(11) NOT NULL,
  `activa` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_salas`
--

INSERT INTO `tbl_salas` (`id_sala`, `nombre`, `capacidad`, `activa`) VALUES
(1, 'Sala 1', 100, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_sillas`
--

CREATE TABLE `tbl_sillas` (
  `id_silla` int(11) NOT NULL,
  `id_bloque` int(11) NOT NULL,
  `fila` varchar(1) NOT NULL,
  `tipo_silla` enum('Standard','Discapacitados') DEFAULT 'Standard',
  `disponible` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_sillas`
--

INSERT INTO `tbl_sillas` (`id_silla`, `id_bloque`, `fila`, `tipo_silla`, `disponible`) VALUES
(1, 1, 'A', 'Standard', 0),
(2, 1, 'A', 'Discapacitados', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_usuarios`
--

CREATE TABLE `tbl_usuarios` (
  `id_usuarios` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `tipo_documento` enum('cedula','pasaporte','tarjeta_identidad','cedula_extranjeria') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  `tipo_usuario` enum('cliente','cajero','administrador') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_usuarios`
--

INSERT INTO `tbl_usuarios` (`id_usuarios`, `nombres`, `apellidos`, `correo`, `contraseña`, `telefono`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `fecha_registro`, `activo`, `tipo_usuario`) VALUES
(1, 'Laura', 'Gómez', 'laura.gomez@email.com', 'pass123', '3001234567', 'cedula', '1020304050', '1990-05-15', '2025-09-11 01:15:05', 1, 'cliente'),
(2, 'Carlos', 'Ramírez', 'carlos.ramirez@email.com', 'pass456', '3019876543', 'pasaporte', 'AB123456', '1985-08-22', '2025-09-11 01:15:05', 1, 'cajero'),
(3, 'Ana', 'Torres', 'ana.torres@email.com', 'admin789', '3021122334', 'cedula_extranjeria', 'EX998877', '1980-03-10', '2025-09-11 01:15:05', 1, 'administrador');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tbl_ventas`
--

CREATE TABLE `tbl_ventas` (
  `id_venta` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_cajero` int(11) NOT NULL,
  `id_funcion` int(11) NOT NULL,
  `fecha_venta` timestamp NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(10,2) NOT NULL,
  `descuento_vip` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') NOT NULL,
  `numero_ticket` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tbl_ventas`
--

INSERT INTO `tbl_ventas` (`id_venta`, `id_cliente`, `id_cajero`, `id_funcion`, `fecha_venta`, `subtotal`, `descuento_vip`, `total`, `metodo_pago`, `numero_ticket`) VALUES
(1, 1, 2, 1, '2025-09-11 01:15:06', 15000.00, 2250.00, 12750.00, 'tarjeta', 'TICKET001');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `conversaciones_chatbot`
--
ALTER TABLE `conversaciones_chatbot`
  ADD PRIMARY KEY (`id_conversacion`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Indices de la tabla `detalles_reserva`
--
ALTER TABLE `detalles_reserva`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_reserva` (`id_reserva`),
  ADD KEY `id_silla` (`id_silla`);

--
-- Indices de la tabla `detalles_venta`
--
ALTER TABLE `detalles_venta`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_silla` (`id_silla`);

--
-- Indices de la tabla `logs_actividad`
--
ALTER TABLE `logs_actividad`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tbl_admins`
--
ALTER TABLE `tbl_admins`
  ADD PRIMARY KEY (`id_admin`);

--
-- Indices de la tabla `tbl_bloquesillas`
--
ALTER TABLE `tbl_bloquesillas`
  ADD PRIMARY KEY (`id_bloque`),
  ADD KEY `id_sala` (`id_sala`);

--
-- Indices de la tabla `tbl_cajeros`
--
ALTER TABLE `tbl_cajeros`
  ADD PRIMARY KEY (`id_cajero`),
  ADD UNIQUE KEY `cod_empleado` (`cod_empleado`);

--
-- Indices de la tabla `tbl_clientes`
--
ALTER TABLE `tbl_clientes`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `tbl_funcion`
--
ALTER TABLE `tbl_funcion`
  ADD PRIMARY KEY (`id_funcion`),
  ADD KEY `id_pelicula` (`id_pelicula`),
  ADD KEY `id_sala` (`id_sala`);

--
-- Indices de la tabla `tbl_pelicula`
--
ALTER TABLE `tbl_pelicula`
  ADD PRIMARY KEY (`id_pelicula`);

--
-- Indices de la tabla `tbl_reservas`
--
ALTER TABLE `tbl_reservas`
  ADD PRIMARY KEY (`id_reserva`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_funcion` (`id_funcion`);

--
-- Indices de la tabla `tbl_salas`
--
ALTER TABLE `tbl_salas`
  ADD PRIMARY KEY (`id_sala`);

--
-- Indices de la tabla `tbl_sillas`
--
ALTER TABLE `tbl_sillas`
  ADD PRIMARY KEY (`id_silla`),
  ADD KEY `id_bloque` (`id_bloque`);

--
-- Indices de la tabla `tbl_usuarios`
--
ALTER TABLE `tbl_usuarios`
  ADD PRIMARY KEY (`id_usuarios`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `tbl_ventas`
--
ALTER TABLE `tbl_ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD UNIQUE KEY `numero_ticket` (`numero_ticket`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_cajero` (`id_cajero`),
  ADD KEY `id_funcion` (`id_funcion`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `conversaciones_chatbot`
--
ALTER TABLE `conversaciones_chatbot`
  MODIFY `id_conversacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `detalles_reserva`
--
ALTER TABLE `detalles_reserva`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `detalles_venta`
--
ALTER TABLE `detalles_venta`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `logs_actividad`
--
ALTER TABLE `logs_actividad`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tbl_bloquesillas`
--
ALTER TABLE `tbl_bloquesillas`
  MODIFY `id_bloque` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tbl_funcion`
--
ALTER TABLE `tbl_funcion`
  MODIFY `id_funcion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tbl_pelicula`
--
ALTER TABLE `tbl_pelicula`
  MODIFY `id_pelicula` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tbl_reservas`
--
ALTER TABLE `tbl_reservas`
  MODIFY `id_reserva` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tbl_salas`
--
ALTER TABLE `tbl_salas`
  MODIFY `id_sala` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tbl_sillas`
--
ALTER TABLE `tbl_sillas`
  MODIFY `id_silla` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tbl_usuarios`
--
ALTER TABLE `tbl_usuarios`
  MODIFY `id_usuarios` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tbl_ventas`
--
ALTER TABLE `tbl_ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `conversaciones_chatbot`
--
ALTER TABLE `conversaciones_chatbot`
  ADD CONSTRAINT `conversaciones_chatbot_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tbl_clientes` (`id_cliente`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalles_reserva`
--
ALTER TABLE `detalles_reserva`
  ADD CONSTRAINT `detalles_reserva_ibfk_1` FOREIGN KEY (`id_reserva`) REFERENCES `tbl_reservas` (`id_reserva`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalles_reserva_ibfk_2` FOREIGN KEY (`id_silla`) REFERENCES `tbl_sillas` (`id_silla`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalles_venta`
--
ALTER TABLE `detalles_venta`
  ADD CONSTRAINT `detalles_venta_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `tbl_ventas` (`id_venta`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalles_venta_ibfk_2` FOREIGN KEY (`id_silla`) REFERENCES `tbl_sillas` (`id_silla`) ON DELETE CASCADE;

--
-- Filtros para la tabla `logs_actividad`
--
ALTER TABLE `logs_actividad`
  ADD CONSTRAINT `logs_actividad_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `tbl_usuarios` (`id_usuarios`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_admins`
--
ALTER TABLE `tbl_admins`
  ADD CONSTRAINT `tbl_admins_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `tbl_usuarios` (`id_usuarios`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_bloquesillas`
--
ALTER TABLE `tbl_bloquesillas`
  ADD CONSTRAINT `tbl_bloquesillas_ibfk_1` FOREIGN KEY (`id_sala`) REFERENCES `tbl_salas` (`id_sala`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_cajeros`
--
ALTER TABLE `tbl_cajeros`
  ADD CONSTRAINT `tbl_cajeros_ibfk_1` FOREIGN KEY (`id_cajero`) REFERENCES `tbl_usuarios` (`id_usuarios`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_clientes`
--
ALTER TABLE `tbl_clientes`
  ADD CONSTRAINT `tbl_clientes_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tbl_usuarios` (`id_usuarios`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_funcion`
--
ALTER TABLE `tbl_funcion`
  ADD CONSTRAINT `tbl_funcion_ibfk_1` FOREIGN KEY (`id_pelicula`) REFERENCES `tbl_pelicula` (`id_pelicula`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_funcion_ibfk_2` FOREIGN KEY (`id_sala`) REFERENCES `tbl_salas` (`id_sala`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_reservas`
--
ALTER TABLE `tbl_reservas`
  ADD CONSTRAINT `tbl_reservas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tbl_clientes` (`id_cliente`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_reservas_ibfk_2` FOREIGN KEY (`id_funcion`) REFERENCES `tbl_funcion` (`id_funcion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_sillas`
--
ALTER TABLE `tbl_sillas`
  ADD CONSTRAINT `tbl_sillas_ibfk_1` FOREIGN KEY (`id_bloque`) REFERENCES `tbl_bloquesillas` (`id_bloque`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tbl_ventas`
--
ALTER TABLE `tbl_ventas`
  ADD CONSTRAINT `tbl_ventas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tbl_clientes` (`id_cliente`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_ventas_ibfk_2` FOREIGN KEY (`id_cajero`) REFERENCES `tbl_cajeros` (`id_cajero`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_ventas_ibfk_3` FOREIGN KEY (`id_funcion`) REFERENCES `tbl_funcion` (`id_funcion`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
