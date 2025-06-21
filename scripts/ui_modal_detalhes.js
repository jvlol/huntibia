// Arquivo: scripts/ui_modal_detalhes.js

// DEFINA AS FUNÇÕES QUE SERÃO CHAMADAS PRIMEIRO
function fecharModalDetalhesHunt() {
    console.log("Fechando modal de detalhes...");
    const modalEl = document.getElementById('modalDetalhesHunt');
    if (modalEl) {
        modalEl.style.display = 'none';
    } else {
        console.error("Elemento #modalDetalhesHunt não encontrado ao tentar fechar.");
    }
    // Limpa a hunt selecionada para admin ao fechar o modal
    window.huntSelecionadaAdmin = null; 
    const adminHuntNameEl = document.getElementById('adminHuntName');
    const adminGifPreviewEl = document.getElementById('adminGifPreview'); 
    if(adminHuntNameEl) adminHuntNameEl.textContent = 'Nenhuma';
    if (typeof resetAdminGifInput === "function") resetAdminGifInput(); // Limpa input/preview do GIF
    else console.warn("resetAdminGifInput não definida ao fechar modal de detalhes.");
}


function abrirModalDetalhesHunt(nomeHunt) {
    console.log("Abrindo detalhes para:", nomeHunt);

    // Assegura que as globais estão disponíveis, se você ainda estiver usando window.
    // Seria melhor passar como parâmetros ou ter um objeto de estado global, mas vamos manter assim por ora
    const huntsCombinadasParaDetalhes = window.huntsCombinadas || [];
    
    const hunt = huntsCombinadasParaDetalhes.find(h => h.nome === nomeHunt);
    if (!hunt) {
        console.error(`Hunt "${nomeHunt}" não encontrada em huntsCombinadas.`);
        alert(`ERRO INTERNO: Hunt "${nomeHunt}" não encontrada.`);
        return;
    }

    window.huntSelecionadaAdmin = nomeHunt;
    const adminHuntNameEl = document.getElementById('adminHuntName');
    if (adminHuntNameEl) adminHuntNameEl.textContent = nomeHunt;
    
    if (typeof resetAdminGifInput === "function") resetAdminGifInput();
    
    const adminGifPreviewEl = document.getElementById('adminGifPreview');
    if (hunt.gif_url && adminGifPreviewEl) {
        adminGifPreviewEl.src = hunt.gif_url;
        adminGifPreviewEl.style.display = 'block';
    } else if (adminGifPreviewEl) {
        adminGifPreviewEl.style.display = 'none';
        adminGifPreviewEl.src = '#';
    }
    
    const ag = hunt.agregados || { /* Fallback */
        media_balanco_ph: 0, media_xp_ph: 0, media_loot_ph: 0, media_supplies_ph: 0,
        media_duracao_sessao_min: 0, total_horas_registradas: 0,
        min_balanco_ph: null, max_balanco_ph: null, min_xp_ph: null, max_xp_ph: null,
        min_loot_ph: null, max_loot_ph: null, min_supplies_ph: null, max_supplies_ph: null,
        min_duracao_sessao_min: null, max_duracao_sessao_min: null,
        recomendacoes_hunt_base: hunt.recomendacoes_hunt || 'N/A',
        faixas_skills: {}, melhores_loots_calculados: [], media_avaliacao: 0
    };
    const contribuicoesDaHunt = hunt.contribuicoes || [];
    const numContr = contribuicoesDaHunt.length;

    const modalEl = document.getElementById('modalDetalhesHunt');
    const nomeEl = document.getElementById('detalhesHuntNome');
    const corpoEl = document.getElementById('detalhesHuntCorpo');
    const btnContribuirEl = document.getElementById('btnContribuirDoDetalhe');

    if (!modalEl || !nomeEl || !corpoEl || !btnContribuirEl) {
        console.error("Elementos do DOM do modal de detalhes não encontrados!");
        return;
    }
    nomeEl.textContent = hunt.nome;

    const formatMinMaxDisplay = (min, max, isCurrency = false, unit = '') => {
        if (numContr > 1 && min !== null && max !== null && typeof min === 'number' && typeof max === 'number' && min !== max) {
            if (typeof formatNumber !== "function") {
                return ` (Min: ${min}${unit} - Max: ${max}${unit})`;
            }
            return ` <small class="stat-min-max">(Min: ${formatNumber(min, isCurrency, 0)}${unit} - Max: ${formatNumber(max, isCurrency, 0)}${unit})</small>`;
        }
        return '';
    };

    // GERAÇÃO DO HTML (mantida como na sua última versão correta para os loots e monstros)
    let statsPrincipaisHTML = `
        <div class="hunt-aggregated-stats-garmoth">
            <div class="garmoth-stat"><label>Balance /h</label><span>${formatNumber(ag.media_balanco_ph, true)} ${formatMinMaxDisplay(ag.min_balanco_ph, ag.max_balanco_ph, true)}</span></div>
            <div class="garmoth-stat"><label>XP /h</label><span>${formatNumber(ag.media_xp_ph)} ${formatMinMaxDisplay(ag.min_xp_ph, ag.max_xp_ph)}</span></div>
            <div class="garmoth-stat"><label>Loot /h</label><span>${formatNumber(ag.media_loot_ph, true)} ${formatMinMaxDisplay(ag.min_loot_ph, ag.max_loot_ph, true)}</span></div>
            <div class="garmoth-stat"><label>Supplies /h</label><span>${formatNumber(ag.media_supplies_ph, true)} ${formatMinMaxDisplay(ag.min_supplies_ph, ag.max_supplies_ph, true)}</span></div>
            <div class="garmoth-stat"><label>Duração Sessão</label><span>${(ag.media_duracao_sessao_min || 0).toFixed(0)} min ${formatMinMaxDisplay(ag.min_duracao_sessao_min, ag.max_duracao_sessao_min, false, ' min')}</span></div>
            <div class="garmoth-stat"><label>Total Horas Reg.</label><span>${(ag.total_horas_registradas || 0).toFixed(1)} h</span></div>
        </div>`;

    let descricaoOriginalHTML = `<div class="recomendacoes-detalhadas-hunt hunt-descricao-original"><h4>Descrição Original da Hunt</h4><div class="recomendacao-texto">${ag.recomendacoes_hunt_base || 'Nenhuma recomendação específica fornecida.'}</div></div>`;
    
    let skillsObservadasHTML = `<div class="recomendacoes-detalhadas-hunt">`;
    if (ag.faixas_skills && Object.keys(ag.faixas_skills).length > 0) {
        skillsObservadasHTML += `<h4>Skills Observadas (Min - Max)</h4><div class="recomendacoes-skills-faixa">`;
        for (const voc in ag.faixas_skills) {
            skillsObservadasHTML += `<strong class="skill-voc-label">${voc}:</strong>`;
            for (const skillName in ag.faixas_skills[voc]) {
                const faixa = ag.faixas_skills[voc][skillName];
                let skillLabel = skillName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                if (skillName === "meleeSkill") skillLabel = "Melee"; else if (skillName === "shieldingSkill") skillLabel = "Shield"; else if (skillName === "distanceSkill") skillLabel = "Dist"; else if (skillName === "magicLevel") skillLabel = "ML"; else if (skillName === "fistFighting") skillLabel = "Fist";
                skillsObservadasHTML += `<div class="skill-faixa-item"><strong>${skillLabel}:</strong> ${faixa.min} - ${faixa.max}</div>`;
            }
        }
        skillsObservadasHTML += `</div>`;
    } else { skillsObservadasHTML += `<h4>Skills Observadas (Min - Max)</h4><div class="recomendacoes-skills-faixa">Nenhuma contribuição com skills registrada ainda.</div>`; }
    skillsObservadasHTML += `</div>`;


    let duasColunasHTML = `<div class="hunt-detalhes-duas-colunas">`;
    // Coluna Esquerda: Loots
    duasColunasHTML += `<div class="coluna-loots">`;
    duasColunasHTML += `<h4 class="coluna-titulo">Loots da Hunt</h4>`;
    let topLootIconsHTML = (ag.melhores_loots_calculados || []).slice(0, 5).map(loot => {
        const title = `${loot.nome} (${formatNumber(loot.qtd_ph)}/h${loot.prata_ph > 0 ? ', ' + formatNumber(loot.prata_ph, true) + ' gp/h' : ''})`;
        const icone = (typeof buscarIconeParaItem === "function") ? buscarIconeParaItem(loot.nome) : "gifs/default.gif";
        return `<img src="${icone}" title="${title}" alt="${loot.nome}">`;
    }).join('');
    duasColunasHTML += `<div class="top-loot-icons">${topLootIconsHTML || '<small>Sem destaques.</small>'}</div>`;
    duasColunasHTML += `<div class="loots-lista-header"><span class="header-item-nome">Item</span><span class="header-item-stats"><span class="sub-header-qtd">Qtd/h</span><span class="sub-header-perc">% Itens</span></span></div><div class="loots-lista-vertical">`;
    if (ag.melhores_loots_calculados && ag.melhores_loots_calculados.length > 0) {
        ag.melhores_loots_calculados.forEach(loot => {
            let percDisplay = loot.percentual_instancias_loot !== null && loot.percentual_instancias_loot !== undefined ? `${loot.percentual_instancias_loot.toFixed(1)}%` : "-";
            duasColunasHTML += `<div class="loot-lista-vertical-item"><span class="loot-lista-vertical-nome" title="${loot.nome}">${loot.nome}</span><div class="loot-lista-vertical-stats"><span class="loot-lista-vertical-qtd">${formatNumber(loot.qtd_ph)}/h</span><span class="loot-lista-vertical-perc">${percDisplay}</span></div></div>`;
        });
    } else { duasColunasHTML += '<div class="no-loot-message">Nenhum loot.</div>'; }
    duasColunasHTML += `</div></div>`; // Fecha lista-vertical e coluna-loots

    // Coluna Direita: Monstros
    duasColunasHTML += `<div class="coluna-monstros">`;
    duasColunasHTML += `<h4 class="coluna-titulo">Monstros na Hunt</h4>`;
    duasColunasHTML += `<div class="loots-lista-header"><span class="header-item-nome">Monstro</span><span class="header-item-stats" style="justify-content: flex-end;"><span class="sub-header-qtd" style="flex-basis:100%; text-align:right;">Média/Sessão</span></span></div><div class="monstros-lista-vertical">`;
    if (ag.lista_monstros_com_media && ag.lista_monstros_com_media.length > 0) {
        ag.lista_monstros_com_media.forEach(monstro => {
            duasColunasHTML += `<div class="loot-lista-vertical-item"><span class="loot-lista-vertical-nome" title="${monstro.nome}">${monstro.nome}</span><div class="loot-lista-vertical-stats" style="justify-content: flex-end;"><span class="loot-lista-vertical-qtd">${formatNumber(monstro.media_mortos_sessao, false, 1)}</span></div></div>`;
        });
    } else { duasColunasHTML += '<div class="no-monsters-message">Nenhum monstro registrado.</div>'; }
    duasColunasHTML += `</div></div>`; // Fecha lista-vertical e coluna-monstros
    duasColunasHTML += `</div>`; // Fecha duas-colunas

    corpoEl.innerHTML = statsPrincipaisHTML + descricaoOriginalHTML + skillsObservadasHTML + duasColunasHTML;

    if(btnContribuirEl) {
        btnContribuirEl.onclick = () => {
            // Chama a função fecharModalDetalhesHunt que AGORA está definida ANTES desta
            fecharModalDetalhesHunt(); 
            
            if (typeof abrirModalContribuicao === "function") abrirModalContribuicao(hunt.nome);
            else console.error("Função abrirModalContribuicao não definida.");
        };
    }
    if (modalEl) modalEl.style.display = 'flex';
    console.log("Modal de detalhes exibido para:", nomeHunt);
}