<?php
// Conexión centralizada: delega a `backend/config/db.php`
require_once __DIR__ . '/config/db.php';

$pdo = db_get_pdo();
