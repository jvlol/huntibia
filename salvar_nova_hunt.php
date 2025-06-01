<?php
$data = json_decode(file_get_contents("php://input"), true);
$arquivo = "banco.json";

$atual = file_exists($arquivo) ? json_decode(file_get_contents($arquivo), true) : [];

$atual[] = $data;

file_put_contents($arquivo, json_encode($atual, JSON_PRETTY_PRINT));
echo json_encode(["status" => "ok"]);
