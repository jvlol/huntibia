    // Arquivo: scripts/ui_modal_novahunt.js
    // Responsável por abrir, fechar e salvar o modal de criação de uma nova hunt.

    // Variáveis globais esperadas (definidas em main.js):
    // - todasHuntsBase
    // - todasContribuicoesGlobais
    // Funções globais esperadas (definidas em outros módulos):
    // - combinarDadosDeHunts (de data_manager.js)
    // - buscarHunts (de main.js)

    function abrirNovaHuntModal() {
        console.log("Abrindo modal para Nova Hunt.");
        // Limpa os campos do formulário
        const nomeEl = document.getElementById('novaHuntNome');
        const levelMinEl = document.getElementById('novaHuntLevelMin');
        const vocPrincipalEl = document.getElementById('novaHuntVocacaoPrincipal');
        const tipoHuntEl = document.getElementById('novaHuntTipo');
        const recomendacoesEl = document.getElementById('novaHuntRecomendacoes');

        if (nomeEl) nomeEl.value = '';
        if (levelMinEl) levelMinEl.value = '';
        if (vocPrincipalEl) vocPrincipalEl.value = 'Knight'; // Padrão
        if (tipoHuntEl) tipoHuntEl.value = 'player'; // Padrão
        if (recomendacoesEl) recomendacoesEl.value = '';

        const modalEl = document.getElementById('novaHuntModal');
        if (modalEl) {
            modalEl.style.display = 'flex';
        } else {
            console.error("Elemento #novaHuntModal não encontrado no DOM!");
        }
    }

    function fecharNovaHuntModal() {
        const modalEl = document.getElementById('novaHuntModal');
        if (modalEl) {
            modalEl.style.display = 'none';
        } else {
            console.error("Elemento #novaHuntModal não encontrado ao tentar fechar.");
        }
    }

    async function salvarNovaHunt() { // Marcada como async por causa do fetch
        console.log("Tentando salvar nova hunt...");
        const nome = document.getElementById('novaHuntNome').value.trim();
        const levelMinStr = document.getElementById('novaHuntLevelMin').value; // Definido ANTES de usar
        const vocPrincipalInput = document.getElementById('novaHuntVocacaoPrincipal').value;
        const tipoHuntInput = document.getElementById('novaHuntTipo').value;
        const recomendacoes = document.getElementById('novaHuntRecomendacoes').value.trim() || 'N/A';

        if (!nome) return alert('Nome da hunt é obrigatório.');
        if (!levelMinStr || isNaN(parseInt(levelMinStr)) || parseInt(levelMinStr) <= 0) return alert('Level mínimo inválido.');
        
        const levelMin = parseInt(levelMinStr);

        // Acessa a variável global
        if (window.todasHuntsBase.find(h => h.nome.toLowerCase() === nome.toLowerCase())) {
            return alert('Uma hunt com este nome já existe.');
        }
        
        const novaHuntBase = {
            nome: nome,
            nivel_min: levelMin,
            vocacoes: [], 
            tipo: tipoHuntInput,
            localizacao: null, 
            recomendacoes_hunt: recomendacoes,
            gif_url: null // Novas hunts começam com GIF nulo
        };

        // Define vocacoes e tipo com base nas seleções
        if (vocPrincipalInput === 'Duo') {
            novaHuntBase.vocacoes = ['Duo'];
            novaHuntBase.tipo = 'duo'; 
        } else if (vocPrincipalInput === 'Team') {
            novaHuntBase.vocacoes = ['Team'];
            novaHuntBase.tipo = 'team'; 
        } else { 
            novaHuntBase.vocacoes = [vocPrincipalInput];
            if (vocPrincipalInput === 'Druid') { 
                novaHuntBase.vocacoes.push('Druid/Sorc'); 
            }
            novaHuntBase.tipo = tipoHuntInput; 
        }
        
        // Lógica para salvar com PHP (se estiver usando)
        try {
            console.log("Enviando para PHP (nova hunt):", novaHuntBase);
            const response = await fetch('php_scripts/salvar_nova_hunt.php', { // Verifique o caminho
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaHuntBase)
            });
            
            if (!response.ok) { 
                throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            alert(result.message);

            if (result.success) {
                window.todasHuntsBase.push(novaHuntBase);
                if(!window.todasContribuicoesGlobais[nome]) window.todasContribuicoesGlobais[nome]=[];
                
                console.log("Nova hunt base adicionada localmente e (simulado) salva no servidor:", novaHuntBase);
                
                // Para ver imediatamente sem recarregar tudo do server, atualiza 'huntsCombinadas'
                if(typeof combinarDadosDeHunts === 'function') combinarDadosDeHunts();
                if(typeof buscarHunts === 'function') buscarHunts(); // Para re-renderizar a lista de cards

                fecharNovaHuntModal();
            }
        } catch (error) {
            console.error('Erro ao salvar nova hunt via PHP:', error);
            // Fallback para localStorage pode ser mantido ou removido se PHP for obrigatório
            // Por ora, mantenho a lógica de alertar o erro de conexão.
            alert('Falha ao conectar com o servidor para salvar nova hunt.');
        }
    }