// Arquivo: scripts/ui_modal_contribuicao.js
// Lida com o modal para adicionar novas contribuições (sessões de hunt).

// Variáveis globais esperadas (devem ser definidas em config.js ou similar):
// - huntAtualParaContribuicao
// - avaliacaoParaContribuicao
// - todasContribuicoesGlobais (para atualização local após sucesso do backend)

// Funções globais esperadas (devem ser definidas em outros arquivos):
// - parseSessionData (de data_parser.js)
// - combinarDadosDeHunts (de data_manager.js)
// - buscarHunts (de main.js)

function abrirModalContribuicao(nomeHunt) {
    console.log("Abrindo modal de contribuição para:", nomeHunt);

    // Define as variáveis globais para o contexto atual do modal
    window.huntAtualParaContribuicao = nomeHunt; 
    window.avaliacaoParaContribuicao = null; // Reseta a avaliação

    const modalTitleEl = document.getElementById('huntModalTitle');
    if (modalTitleEl) {
        modalTitleEl.textContent = nomeHunt;
    } else {
        console.error("Elemento 'huntModalTitle' não encontrado no modal de contribuição!");
    }

    // Limpa os campos do formulário
    const fieldsToReset = ['sessionData', 'inputLevelContribuicao', 'servidorContribuicao', 'vocacaoContribuicao'];
    fieldsToReset.forEach(id => { 
        const el = document.getElementById(id); 
        if (el) {
            el.value = (id === 'vocacaoContribuicao' || id === 'servidorContribuicao') ? "" : ""; 
        }
    });

    // Limpa/reseta os campos de skill dinâmicos
    if (typeof mostrarCamposSkill === "function") {
        mostrarCamposSkill(); // Chamará com a vocação vazia, limpando os campos
    } else {
        console.error("ERRO INTERNO: Função mostrarCamposSkill não está definida neste script (ui_modal_contribuicao.js)!");
    }
    
    // Reseta visualmente os botões de rating
    const btnGostei = document.getElementById('btn-gostei');
    const btnNaoGostei = document.getElementById('btn-nao-gostei');
    if(btnGostei) { 
        btnGostei.style.backgroundColor = ''; 
        btnGostei.classList.remove('selected'); 
    }
    if(btnNaoGostei) { 
        btnNaoGostei.style.backgroundColor = ''; 
        btnNaoGostei.classList.remove('selected'); 
    }
    
    const modalContribuicaoEl = document.getElementById('modalContribuicao');
    if (modalContribuicaoEl) {
        modalContribuicaoEl.style.display = 'flex';
        console.log("Modal de contribuição exibido.");
    } else {
        console.error("ERRO CRÍTICO: Elemento 'modalContribuicao' não encontrado no DOM!");
        alert("ERRO INTERNO: Modal de contribuição não pôde ser aberto.");
    }
}

function fecharModalContribuicao() {
    const modalContribuicaoEl = document.getElementById('modalContribuicao');
    if (modalContribuicaoEl) {
        modalContribuicaoEl.style.display = 'none';
        console.log("Modal de contribuição fechado.");
    }
}

function setRatingContribuicao(rating) {
    window.avaliacaoParaContribuicao = rating; // Usa a variável global de config.js
    const btnGostei = document.getElementById('btn-gostei');
    const btnNaoGostei = document.getElementById('btn-nao-gostei');

    if(btnGostei) {
        btnGostei.style.backgroundColor = rating === 1 ? 'var(--cor-rating-gostei)' : ''; 
        rating === 1 ? btnGostei.classList.add('selected') : btnGostei.classList.remove('selected');
    }
    if(btnNaoGostei) {
        btnNaoGostei.style.backgroundColor = rating === 0 ? 'var(--cor-rating-naogostei)' : ''; 
        rating === 0 ? btnNaoGostei.classList.add('selected') : btnNaoGostei.classList.remove('selected');
    }
}

function mostrarCamposSkill() {
    const vocacaoSelecionada = document.getElementById('vocacaoContribuicao').value;
    const containerSkills = document.getElementById('camposSkillDinamicos');
    if (!containerSkills) {
        // console.warn("Elemento 'camposSkillDinamicos' não encontrado, não pode mostrar campos de skill.");
        return; // Sai silenciosamente se o container não existir
    }
    containerSkills.innerHTML = ''; // Limpa campos anteriores

    let camposHTML = '';
    switch (vocacaoSelecionada) {
        case 'Knight':
            camposHTML = `
                <label for="skillMeleeKnight">Melee (Sword/Axe/Club):</label>
                <input type="number" id="skillMeleeKnight" placeholder="Ex: 110" min="10">
                <label for="skillShieldKnight">Shielding:</label>
                <input type="number" id="skillShieldKnight" placeholder="Ex: 105" min="10">`;
            break;
        case 'Paladin':
            camposHTML = `
                <label for="skillDistancePaladin">Distance:</label>
                <input type="number" id="skillDistancePaladin" placeholder="Ex: 120" min="10">
                <label for="skillShieldPaladin">Shielding (Opcional):</label>
                <input type="number" id="skillShieldPaladin" placeholder="Ex: 90" min="10">`;
            break;
        case 'Druid':
        case 'Sorcerer':
            camposHTML = `
                <label for="skillMagicLevel">Magic Level:</label>
                <input type="number" id="skillMagicLevel" placeholder="Ex: 90" min="0">`;
            break;
        case 'Monk':
            camposHTML = `
                <label for="skillFistMonk">Fist Fighting:</label>
                <input type="number" id="skillFistMonk" placeholder="Ex: 100" min="10">`;
            break;
    }
    containerSkills.innerHTML = camposHTML;
}

async function salvarContribuicao() {
    console.log("Iniciando salvarContribuicao...");
    const sessionText = document.getElementById('sessionData').value;
    const levelStr = document.getElementById('inputLevelContribuicao').value;
    const servidor = document.getElementById('servidorContribuicao').value;
    const vocacaoContr = document.getElementById('vocacaoContribuicao').value;

    if (!sessionText.trim()) return alert('Por favor, cole os dados da sua sessão do Tibia Analyzer.');
    if (!levelStr.trim() || isNaN(parseInt(levelStr)) || parseInt(levelStr) <= 0) return alert('Por favor, insira um level válido para a hunt.');
    const level = parseInt(levelStr);
    if (!servidor) return alert('Por favor, selecione um servidor.');
    if (window.avaliacaoParaContribuicao === null) return alert('Por favor, avalie a hunt (Gostei/Não gostei).');
    if (!vocacaoContr) return alert('Por favor, selecione sua vocação para esta contribuição.');

    const skillsContribuidas = {};
    let skillValida = true;
    let erroSkillMsg = `Preencha as skills corretamente para ${vocacaoContr}. Verifique os valores mínimos (geralmente 10, ML 0).`;

    switch (vocacaoContr) {
        case 'Knight':
            const meleeSkillVal = document.getElementById('skillMeleeKnight').value;
            const shieldKnightVal = document.getElementById('skillShieldKnight').value;
            const meleeSkill = meleeSkillVal ? parseInt(meleeSkillVal) : NaN;
            const shieldKnight = shieldKnightVal ? parseInt(shieldKnightVal) : NaN;
            if (isNaN(meleeSkill) || isNaN(shieldKnight) || meleeSkill < 10 || shieldKnight < 10) skillValida = false;
            else { skillsContribuidas.meleeSkill = meleeSkill; skillsContribuidas.shieldingSkill = shieldKnight; }
            break;
        case 'Paladin':
            const distSkillVal = document.getElementById('skillDistancePaladin').value;
            const shieldPalaValue = document.getElementById('skillShieldPaladin').value; // Pode ser vazio
            const distSkill = distSkillVal ? parseInt(distSkillVal) : NaN;
            if (isNaN(distSkill) || distSkill < 10) {
                skillValida = false;
            } else {
                skillsContribuidas.distanceSkill = distSkill;
                if (shieldPalaValue && shieldPalaValue.trim() !== '') { // Processa shielding só se preenchido
                    const shieldPalaInt = parseInt(shieldPalaValue);
                    if (isNaN(shieldPalaInt) || shieldPalaInt < 10) {
                        skillValida = false; 
                        erroSkillMsg = 'Shielding do Paladin, se preenchido, deve ser um número válido (mínimo 10).';
                    } else {
                        skillsContribuidas.shieldingSkill = shieldPalaInt;
                    }
                }
            }
            break;
        case 'Druid':
        case 'Sorcerer':
            const mlVal = document.getElementById('skillMagicLevel').value;
            const ml = mlVal ? parseInt(mlVal) : NaN;
            if (isNaN(ml) || ml < 0) skillValida = false; else skillsContribuidas.magicLevel = ml;
            break;
        case 'Monk':
            const fistVal = document.getElementById('skillFistMonk').value;
            const fist = fistVal ? parseInt(fistVal) : NaN;
            if (isNaN(fist) || fist < 10) skillValida = false; else skillsContribuidas.fistFighting = fist;
            break;
    }

    if (!skillValida) {
        return alert(erroSkillMsg);
    }
    
    const parsedData = (typeof parseSessionData === "function") ? parseSessionData(sessionText) : null;
    if (!parsedData) {
        console.error("Função parseSessionData não está definida ou não foi encontrada. Verifique data_parser.js e a ordem de carregamento dos scripts.");
        return alert("ERRO INTERNO: Falha ao processar os dados da sessão.");
    }
    if (!parsedData.xpPerHour || parsedData.balanceValue === null || !parsedData.sessionDurationMinutes || parsedData.sessionDurationMinutes <= 0) {
        console.log("Dados parseados da sessão incompletos:", parsedData); // Log para depurar o que foi parseado
        return alert('Dados da sessão colados são incompletos ou inválidos (XP/h, Balance e Duração são cruciais). Verifique o formato do texto.');
    }

    const balanco_ph_calc = (parsedData.balanceValue / (parsedData.sessionDurationMinutes / 60));
    const novaContribuicaoObj = {
        xp_ph: parsedData.xpPerHour, 
        balanco_ph: balanco_ph_calc,
        duracao_min: parsedData.sessionDurationMinutes,
        loot_total_sessao: parsedData.lootValue, 
        supplies_total_sessao: parsedData.suppliesValue,
        level_personagem: level, 
        servidor: servidor, 
        avaliacao: window.avaliacaoParaContribuicao,
        itens_lootados_sessao: parsedData.lootedItems, 
        monstros_mortos_sessao: parsedData.killedMonsters,
        data_contribuicao: new Date().toISOString(),
        vocacao_contribuicao: vocacaoContr,
        skills_contribuicao: skillsContribuidas
    };
    
    console.log("Objeto de contribuição a ser enviado para PHP:", novaContribuicaoObj);

    try {
        const response = await fetch('php_scripts/salvar_contribuicao.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                huntNome: window.huntAtualParaContribuicao,
                contribuicao: novaContribuicaoObj
            })
        });
        if (!response.ok) {
             const errorText = await response.text();
             console.error("Resposta do servidor (erro):", errorText);
             throw new Error(`Erro do servidor: ${response.status} ${response.statusText}. Detalhes: ${errorText}`);
        }
        const result = await response.json();
        alert(result.message || "Contribuição processada pelo servidor!");

        if (result.success) {
            if(!window.todasContribuicoesGlobais[window.huntAtualParaContribuicao]) {
                window.todasContribuicoesGlobais[window.huntAtualParaContribuicao] = [];
            }
            window.todasContribuicoesGlobais[window.huntAtualParaContribuicao].push(novaContribuicaoObj);
            
            console.log("Contribuição adicionada ao estado local após sucesso do backend:", novaContribuicaoObj);
            
            // localStorage.setItem('todasContribuicoesGlobais_sim', JSON.stringify(window.todasContribuicoesGlobais)); // Para persistência local se o PHP falhar

            if(typeof combinarDadosDeHunts === 'function') combinarDadosDeHunts(); else console.error("combinarDadosDeHunts não definida");
            if(typeof buscarHunts === 'function') buscarHunts(); else console.error("buscarHunts não definida");
            
            fecharModalContribuicao();
        }
    } catch (error) {
        console.error('Erro ao salvar contribuição via PHP:', error);
        alert(`Falha ao comunicar com o servidor para salvar contribuição: ${error.message}`);
    }
}
// Em scripts/data_parser.js

function parseSessionData(text) {
    console.log("--- Iniciando parseSessionData ---");
    // Log do texto de entrada no INÍCIO para ver o que está sendo processado
    // console.log("Texto recebido para parse:\n", text); 

    const data = {
        xpPerHour: null, 
        lootValue: null, 
        suppliesValue: null, 
        balanceValue: null,
        sessionDurationMinutes: null, 
        killedMonsters: [], // INICIALIZADO COMO ARRAY VAZIO
        lootedItems: []     // INICIALIZADO COMO ARRAY VAZIO
    };
    let match; // Declara match aqui para ser usado por todas as regex

    // XP/h
    match = text.match(/XP\/h:\s*([\d,]+)/i);
    if (match && match[1]) {
        data.xpPerHour = parseInt(match[1].replace(/,/g, ''));
    } else {
        match = text.match(/Raw XP\/h:\s*([\d,]+)/i);
        if (match && match[1]) {
            data.xpPerHour = parseInt(match[1].replace(/,/g, ''));
        }
    }
    // Log após tentar obter XP/h
    // console.log(data.xpPerHour ? `XP/h encontrado: ${data.xpPerHour}` : "XP/h NÃO encontrado.");

    // Loot
    match = text.match(/Loot:\s*([\d,]+)/i);
    if (match && match[1]) data.lootValue = parseInt(match[1].replace(/,/g, ''));
    // console.log(data.lootValue ? `Loot encontrado: ${data.lootValue}` : "Loot NÃO encontrado.");


    // Supplies
    match = text.match(/Supplies:\s*([\d,]+)/i);
    if (match && match[1]) data.suppliesValue = parseInt(match[1].replace(/,/g, ''));
    // console.log(data.suppliesValue ? `Supplies encontrado: ${data.suppliesValue}` : "Supplies NÃO encontrado.");

    // Balance
    match = text.match(/Balance:\s*([-\d,]+)/i);
    if (match && match[1]) {
        data.balanceValue = parseInt(match[1].replace(/,/g, ''));
    } else if (data.lootValue !== null && data.suppliesValue !== null) {
        data.balanceValue = data.lootValue - data.suppliesValue;
    }
    // console.log(data.balanceValue !== null ? `Balance: ${data.balanceValue}` : "Balance NÃO encontrado/calculado.");


    // Session Duration
    match = text.match(/Session:\s*(\d+):(\d{2})/i); // A regex original deve funcionar
    if (match && match[1] && match[2]) {
        data.sessionDurationMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    // console.log(data.sessionDurationMinutes ? `Duração da Sessão: ${data.sessionDurationMinutes} min` : "Duração da Sessão NÃO encontrada.");


    // Killed Monsters
    // A regex original (?=Looted Items:|^\s*$) pode ser problemática com variações de espaços no fim.
    // Vamos tentar uma regex que pegue tudo até o próximo grande header ou fim do texto.
    const killedBlockMatch = text.match(/Killed Monsters:([\s\S]*?)(Looted Items:|Damage:|Healing:|^\s*Session data:|$)/im);
    if (killedBlockMatch && killedBlockMatch[1]) {
        const killedBlockText = killedBlockMatch[1].trim();
        // console.log("Bloco de texto 'Killed Monsters' encontrado:", killedBlockText);
        killedBlockText.split('\n').forEach(line => {
            const monsterMatch = line.trim().match(/^(\d+)\s*x\s*(.+)/i);
            if (monsterMatch && monsterMatch[2]) { // Garante que nome e quantidade foram capturados
                data.killedMonsters.push({ nome: monsterMatch[2].trim(), quantidade: parseInt(monsterMatch[1]) });
            }
        });
    } else {
        // console.log("NENHUM bloco 'Killed Monsters' encontrado com a regex.");
    }
    // Este log deve mostrar o array populado ou vazio, não undefined
    console.log("Monstros Parseados (após processamento do bloco):", data.killedMonsters); 


    // Looted Items
    // A regex (?=Killed Monsters:|Damage:|Healing:|^\s*Session data:|$) tenta pegar até o próximo bloco conhecido.
    const lootedBlockMatch = text.match(/Looted Items:([\s\S]*?)(Killed Monsters:|Damage:|Healing:|^\s*Session data:|$)/im);
    if (lootedBlockMatch && lootedBlockMatch[1]) {
        const lootedBlockText = lootedBlockMatch[1].trim();
        // console.log("Bloco de texto 'Looted Items' encontrado:", lootedBlockText);
        lootedBlockText.split('\n').forEach(line => {
            const itemMatch = line.trim().match(/^(?:(\d+)\s*x\s+)?(.+)/i); // (quantidade opcional) Nome do item
            if (itemMatch && itemMatch[2]) { // itemMatch[2] é o nome do item
                data.lootedItems.push({ nome: itemMatch[2].trim(), quantidade: parseInt(itemMatch[1]) || 1 });
            }
        });
    } else {
        // console.log("NENHUM bloco 'Looted Items' encontrado com a regex.");
    }
    // console.log("Itens Lootados Parseados:", data.lootedItems);
    
    console.log("Objeto 'data' final do parseSessionData:", JSON.stringify(data, null, 2)); // Usar stringify para ver melhor o objeto
    console.log("--- Fim parseSessionData ---");
    return data;
}