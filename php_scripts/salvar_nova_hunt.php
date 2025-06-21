<?php
header('Content-Type: application/json'); // Informa que a resposta será JSON

// Caminhos para os arquivos JSON (relativos à localização deste script PHP)
$bancoPlayerFile = '../banco_player.json';
$bancoContribFile = '../banco.json';

$response = ['success' => false, 'message' => 'Erro desconhecido.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $novaHuntData = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($novaHuntData['nome'])) {
        $response['message'] = 'Dados inválidos recebidos.';
        echo json_encode($response);
        exit;
    }

    // Carregar banco_player.json
    if (file_exists($bancoPlayerFile)) {
        $huntsBase = json_decode(file_get_contents($bancoPlayerFile), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $huntsBase = []; // Se houver erro no JSON, começa do zero ou trata o erro
        }
    } else {
        $huntsBase = [];
    }

    // Verificar se a hunt já existe
    $huntExistente = false;
    foreach ($huntsBase as $hunt) {
        if (strtolower($hunt['nome']) === strtolower($novaHuntData['nome'])) {
            $huntExistente = true;
            break;
        }
    }

    if ($huntExistente) {
        $response['message'] = 'Uma hunt com este nome já existe.';
    } else {
        // Adicionar a nova hunt
        $huntsBase[] = $novaHuntData; // $novaHuntData já deve ter a estrutura correta

        // Salvar de volta em banco_player.json
        if (file_put_contents($bancoPlayerFile, json_encode($huntsBase, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
            // Adicionar uma entrada vazia para contribuições em banco.json
            if (file_exists($bancoContribFile)) {
                $contribuicoesGlobais = json_decode(file_get_contents($bancoContribFile), true);
                if (json_last_error() !== JSON_ERROR_NONE) $contribuicoesGlobais = [];
            } else {
                $contribuicoesGlobais = [];
            }
            if (!isset($contribuicoesGlobais[$novaHuntData['nome']])) {
                $contribuicoesGlobais[$novaHuntData['nome']] = [];
            }
            file_put_contents($bancoContribFile, json_encode($contribuicoesGlobais, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            
            $response['success'] = true;
            $response['message'] = 'Nova hunt salva com sucesso!';
        } else {
            $response['message'] = 'Erro ao salvar a nova hunt no servidor (banco_player.json).';
        }
    }
} else {
    $response['message'] = 'Método não permitido.';
}

echo json_encode($response);
?>