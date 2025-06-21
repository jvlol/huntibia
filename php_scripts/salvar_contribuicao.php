<?php
header('Content-Type: application/json');
$bancoContribFile = '../banco.json';
$response = ['success' => false, 'message' => 'Erro desconhecido.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data['huntNome']) || !isset($data['contribuicao'])) {
        $response['message'] = 'Dados inválidos para salvar contribuição.';
        echo json_encode($response);
        exit;
    }

    $huntNome = $data['huntNome'];
    $novaContribuicao = $data['contribuicao'];

    if (file_exists($bancoContribFile)) {
        $contribuicoesGlobais = json_decode(file_get_contents($bancoContribFile), true);
        if (json_last_error() !== JSON_ERROR_NONE) $contribuicoesGlobais = [];
    } else {
        $contribuicoesGlobais = [];
    }

    if (!isset($contribuicoesGlobais[$huntNome])) {
        $contribuicoesGlobais[$huntNome] = [];
    }
    $contribuicoesGlobais[$huntNome][] = $novaContribuicao;

    if (file_put_contents($bancoContribFile, json_encode($contribuicoesGlobais, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
        $response['success'] = true;
        $response['message'] = 'Contribuição salva com sucesso!';
    } else {
        $response['message'] = 'Erro ao salvar a contribuição no servidor (banco.json).';
    }

} else {
    $response['message'] = 'Método não permitido.';
}
echo json_encode($response);
?>