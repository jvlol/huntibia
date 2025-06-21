<?php
header('Content-Type: application/json');
$bancoPlayerFile = '../banco_player.json';
$response = ['success' => false, 'message' => 'Erro desconhecido.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data['huntNome']) || !isset($data['gifUrl'])) {
        $response['message'] = 'Dados inválidos para atualizar GIF.';
        echo json_encode($response);
        exit;
    }

    $huntNome = $data['huntNome'];
    $novaGifUrl = $data['gifUrl']; // Pode ser null para remover

    if (file_exists($bancoPlayerFile)) {
        $huntsBase = json_decode(file_get_contents($bancoPlayerFile), true);
        if (json_last_error() !== JSON_ERROR_NONE) $huntsBase = [];
        
        $huntIndex = -1;
        foreach ($huntsBase as $index => $hunt) {
            if (strtolower($hunt['nome']) === strtolower($huntNome)) {
                $huntIndex = $index;
                break;
            }
        }

        if ($huntIndex !== -1) {
            $huntsBase[$huntIndex]['gif_url'] = $novaGifUrl; // Atualiza ou remove
            if (file_put_contents($bancoPlayerFile, json_encode($huntsBase, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
                $response['success'] = true;
                $response['message'] = 'URL do GIF atualizada com sucesso!';
            } else {
                $response['message'] = 'Erro ao salvar atualização do GIF no servidor (banco_player.json).';
            }
        } else {
            $response['message'] = 'Hunt não encontrada para atualizar GIF.';
        }
    } else {
        $response['message'] = 'Arquivo banco_player.json não encontrado.';
    }
} else {
    $response['message'] = 'Método não permitido.';
}
echo json_encode($response);
?>