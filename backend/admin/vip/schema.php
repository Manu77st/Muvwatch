<?php

function mvwColumnExists(PDO $pdo, string $table, string $column): bool
{
    static $allowedTables = ['tbl_clientes'];

    if (!in_array($table, $allowedTables, true)) {
        throw new InvalidArgumentException('Tabla no permitida.');
    }

    if (!preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
        throw new InvalidArgumentException('Columna no permitida.');
    }

    $sql = sprintf("SHOW COLUMNS FROM `%s` LIKE '%s'", $table, $column);
    $stmt = $pdo->query($sql);
    return (bool)$stmt->fetch();
}

function ensureVipSchema(PDO $pdo): void
{
    $alterParts = [];

    if (!mvwColumnExists($pdo, 'tbl_clientes', 'codigo_membresia')) {
        $alterParts[] = "ADD COLUMN `codigo_membresia` VARCHAR(30) NULL AFTER `porcentaje_descuento`";
    }

    if (!mvwColumnExists($pdo, 'tbl_clientes', 'estado_membresia')) {
        $alterParts[] = "ADD COLUMN `estado_membresia` ENUM('activo','inactivo','suspendido') DEFAULT 'activo' AFTER `codigo_membresia`";
    }

    if (!mvwColumnExists($pdo, 'tbl_clientes', 'fecha_inicio_vip')) {
        $alterParts[] = "ADD COLUMN `fecha_inicio_vip` DATE NULL AFTER `estado_membresia`";
    }

    if (!mvwColumnExists($pdo, 'tbl_clientes', 'fecha_fin_vip')) {
        $alterParts[] = "ADD COLUMN `fecha_fin_vip` DATE NULL AFTER `fecha_inicio_vip`";
    }

    if (!mvwColumnExists($pdo, 'tbl_clientes', 'notas')) {
        $alterParts[] = "ADD COLUMN `notas` TEXT NULL AFTER `fecha_fin_vip`";
    }

    if (!empty($alterParts)) {
        $sql = 'ALTER TABLE `tbl_clientes` ' . implode(', ', $alterParts);
        $pdo->exec($sql);
    }
}
