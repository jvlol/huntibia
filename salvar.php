<?php
$data = json_decode(file_get_contents("php://input"), true);
$arquivo = "banco_player.json";

if (!file_exists($arquivo)) {
    echo json_encode(["status" => "erro", "msg" => "Arquivo não encontrado"]);
    exit;
}

$atual = json_decode(file_get_contents($arquivo), true);

foreach ($atual as &$hunt) {
    if ($hunt["nome"] === $data["nome"]) {
        $hunt["contribuicoes"][] = [
            "xp" => $data["xp"],
            "gold" => $data["gold"],
            "servidor" => $data["servidor"],
            "level" => $data["level"],
            "avaliacao" => $data["avaliacao"]
        ];
        break;
    }
}

file_put_contents($arquivo, json_encode($atual, JSON_PRETTY_PRINT));
echo json_encode(["status" => "ok"]);
