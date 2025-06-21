// Variáveis globais acessadas: huntSelecionadaAdmin, todasHuntsBase, huntsCombinadas
// Funções globais chamadas: resetAdminGifInput (deste arquivo ou utils), atualizarUrlGifParaHunt (deste arquivo), mudarPagina

function resetAdminGifInput() { // Pode estar aqui ou em utils.js
    const elFile = document.getElementById('adminGifFile');
    const elPreview = document.getElementById('adminGifPreview');
    if (elFile) elFile.value = ''; 
    if (elPreview) {
        elPreview.style.display = 'none'; 
        elPreview.src = '#';
    }
}

function salvarGifAdmin() {
    if (!window.huntSelecionadaAdmin) return alert("Abra os detalhes de uma hunt primeiro.");
    const fileInput = document.getElementById('adminGifFile');
    const file = fileInput.files[0];
    if (!file) {
        if (confirm(`Nenhum arquivo. Remover GIF de '${window.huntSelecionadaAdmin}'?`)) {
            atualizarUrlGifParaHunt(null);
        }
        resetAdminGifInput(); // Limpa mesmo se não remover
        return;
    }
    if (file.type !== "image/gif") {
        alert("Selecione um arquivo GIF.");
        resetAdminGifInput();
        return;
    }
    const caminhoSimulado = `gifs/${file.name}`; 
    atualizarUrlGifParaHunt(caminhoSimulado);
    resetAdminGifInput();
}

async function atualizarUrlGifParaHunt(novaUrl) { // Tornando-a async
    const huntNome = window.huntSelecionadaAdmin; // Pega da global
    if (!huntNome) {
        console.error("Nenhuma hunt selecionada no admin para atualizar GIF.");
        return;
    }

    const payload = {
        huntNome: huntNome,
        gifUrl: novaUrl 
    };

    try {
        const response = await fetch('php_scripts/salvar_gif_url.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        alert(result.message);

        if (result.success) {
            const huntIdxBase = window.todasHuntsBase.findIndex(h => h.nome === huntNome);
            if(huntIdxBase !== -1) window.todasHuntsBase[huntIdxBase].gif_url = novaUrl;
            
            const huntComb = window.huntsCombinadas.find(h => h.nome === huntNome);
            if(huntComb) huntComb.gif_url = novaUrl;

            if (typeof mudarPagina === "function") mudarPagina(window.paginaAtual); 
            else if (typeof buscarHunts === "function") buscarHunts();
        }
    } catch (error) {
        console.error('Erro ao atualizar URL do GIF:', error);
        alert('Falha ao conectar com o servidor para atualizar GIF.');
    }
}