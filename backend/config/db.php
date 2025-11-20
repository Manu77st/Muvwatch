<?php
/**
 * Archivo de configuración central de la base de datos.
 * Lee variables desde `.env` si existe y expone la función `db_get_pdo()`.
 */

if (!function_exists('db_parse_env')) {
    function db_parse_env($path)
    {
        $result = [];
        if (!file_exists($path)) {
            return $result;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            if (strpos($line, '=') === false) {
                continue;
            }
            list($k, $v) = explode('=', $line, 2);
            $v = trim($v);
            // remover comillas simples o dobles envolventes
            if ((substr($v, 0, 1) === '"' && substr($v, -1) === '"') || (substr($v, 0, 1) === "'" && substr($v, -1) === "'")) {
                $v = substr($v, 1, -1);
            }
            $result[trim($k)] = $v;
        }
        return $result;
    }
}

// Cargar .env si existe (asumiendo que .env está en la raíz del proyecto)
$env = db_parse_env(__DIR__ . '/../../.env');

$DB_HOST = $env['DB_HOST'] ?? '127.0.0.1';
$DB_USER = $env['DB_USER'] ?? 'root';
$DB_PASS = $env['DB_PASS'] ?? '';
$DB_NAME = $env['DB_NAME'] ?? 'muvwatch';
$DB_PORT = $env['DB_PORT'] ?? '3306';
$DB_CHARSET = $env['DB_CHARSET'] ?? 'utf8mb4';

if (!function_exists('db_get_pdo')) {
    function db_get_pdo()
    {
        static $pdo = null;
        if ($pdo !== null) {
            return $pdo;
        }

        global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT, $DB_CHARSET;

        $dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset={$DB_CHARSET}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
        } catch (PDOException $e) {
            die('Error de conexión: ' . $e->getMessage());
        }

        return $pdo;
    }
}
