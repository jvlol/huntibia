// Variáveis globais
let todasHuntsBase = [];
let todasContribuicoesGlobais = {};
let huntsCombinadas = [];
let huntAtualParaContribuicao = null;
let avaliacaoParaContribuicao = null;
let huntSelecionadaAdmin = null; // Para o painel de admin de GIF

// Paginação
let paginaAtual = 1;
const ITENS_POR_PAGINA = 9; // Quantas hunts por página

const itemIconMap = {
    "gold coin": "https://cdn.tibiaroute.com/items/Gold-Coin.gif",
    "platinum coin": "https://cdn.tibiaroute.com/items/Platinum-Coin.gif",
    "crystal coin": "https://static.tibia.com/images/library/crystalcoin.gif",
    "ape fur": "https://static.tibia.com/images/library/apefur.gif",
    "piece of swinesnout leather": "https://static.tibia.com/images/library/pieceofswinesnoutleather.gif",
    "lizard scale": "https://static.tibia.com/images/library/lizardscale.gif",
    "lizard leather": "https://static.tibia.com/images/library/lizardleather.gif",
    "red piece of cloth": "https://static.tibia.com/images/library/redpieceofcloth.gif",
    "broken shamanic staff": "https://www.tibiawiki.com.br/images/c/c8/Broken_Shamanic_Staff.gif",
    "elvish talisman": "https://www.tibiawiki.com.br/images/9/92/Elvish_Talisman.gif",
    "cultish robe": "https://www.tibiawiki.com.br/images/a/a5/Cultish_Robe.gif",
    "sentinel shield": "https://www.tibiawiki.com.br/images/0/04/Sentinel_Shield.gif",
    "zaoan monk robe": "https://www.tibiawiki.com.br/images/5/5e/Zaoan_Monk_Robe.gif",
    "rope belt": "https://www.tibiawiki.com.br/images/5/55/Rope_Belt.gif",
    "spear": "https://www.tibiawiki.com.br/images/d/d5/Spear.gif",
    "health potion": "https://www.tibiawiki.com.br/images/8/82/Health_Potion.gif",
    "worm": "https://www.tibiawiki.com.br/images/c/c8/Worm_%28Item%29.gif",
    "meat": "https://www.tibiawiki.com.br/images/c/c4/Meat.gif",
    "ham": "https://www.tibiawiki.com.br/images/8/83/Ham.gif",
    "dragon ham": "https://www.tibiawiki.com.br/images/c/cb/Dragon_Ham.gif",
    "default": "https://static.tibia.com/images/library/brokenamulet.gif"
};
const defaultGif = "gifs/tibia_landscape_loop.gif";

// --- FUNÇÕES UTILITÁRIAS ---
function buscarIconeParaItem(nomeItem) {
    const nomeLimpo = nomeItem.toLowerCase().replace(/^(a|an|some)\s+/, '');
    if (itemIconMap[nomeLimpo]) return itemIconMap[nomeLimpo];
    for (const key in itemIconMap) {
        if (key !== "default" && nomeLimpo.includes(key)) return itemIconMap[key];
    }
    return itemIconMap.default;
}

function formatNumber(num, isCurrency = false, precisao = 1) {
    if (num === null || num === undefined || isNaN(num)) return isCurrency ? '0' : 'N/A';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(precisao).replace(/\.0+$/, '') + 'kk';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(precisao).replace(/\.0+$/, '') + 'k';
    return num.toFixed((isCurrency && Math.abs(num) < 1000 && Math.abs(num) !== 0) ? 0 : 0);
}

function renderEstrelas(media, numContribuicoes = 0) {
    const totalEstrelas = 5;
    let htmlEstrelas = '<div class="estrela-container">';
    if (numContribuicoes === 0) {
        for (let i = 0; i < totalEstrelas; i++) {
            htmlEstrelas += `<div class="estrela"><span class="estrela-fundo" style="color:#333;">☆</span></div>`;
        }
    } else {
        for (let i = 1; i <= totalEstrelas; i++) {
            const preenchimentoPercentual = Math.max(0, Math.min(1, media - (i - 1))) * 100;
            htmlEstrelas += `
                <div class="estrela">
                    <span class="estrela-fundo">★</span>
                    <span class="estrela-preenchida" style="width: ${preenchimentoPercentual}%;">★</span>
                </div>`;
        }
    }
    htmlEstrelas += '</div>';
    return htmlEstrelas;
}

// --- PARSER DE DADOS DA SESSÃO ---
function parseSessionData(text) {
    const data = {
        xpPerHour: null, lootValue: null, suppliesValue: null, balanceValue: null,
        sessionDurationMinutes: null, killedMonsters: [], lootedItems: []
    };
    let match;
    match = text.match(/XP\/h:\s*([\d,]+)/);
    if (match) data.xpPerHour = parseInt(match[1].replace(/,/g, ''));
    else { match = text.match(/Raw XP\/h:\s*([\d,]+)/); if (match) data.xpPerHour = parseInt(match[1].replace(/,/g, '')); }
    match = text.match(/Loot:\s*([\d,]+)/); if (match) data.lootValue = parseInt(match[1].replace(/,/g, ''));
    match = text.match(/Supplies:\s*([\d,]+)/); if (match) data.suppliesValue = parseInt(match[1].replace(/,/g, ''));
    match = text.match(/Balance:\s*([-\d,]+)/);
    if (match) data.balanceValue = parseInt(match[1].replace(/,/g, ''));
    else if (data.lootValue !== null && data.suppliesValue !== null) data.balanceValue = data.lootValue - data.suppliesValue;
    match = text.match(/Session:\s*(\d+):(\d{2})/); if (match) data.sessionDurationMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    const killedBlock = text.match(/Killed Monsters:([\s\S]*?)(Looted Items:|$)/im);
    if (killedBlock && killedBlock[1]) {
        killedBlock[1].trim().split('\n').forEach(line => {
            const monsterMatch = line.trim().match(/^(\d+)\s*x\s*(.+)/i);
            if (monsterMatch) data.killedMonsters.push({ nome: monsterMatch[2].trim(), quantidade: parseInt(monsterMatch[1]) });
        });
    }
    const lootedBlock = text.match(/Looted Items:([\s\S]*)/im);
    if (lootedBlock && lootedBlock[1]) {
        lootedBlock[1].trim().split('\n').forEach(line => {
            const itemMatch = line.trim().match(/^(?:(\d+)\s*x\s+)?(.+)/i);
            if (itemMatch && itemMatch[2]) data.lootedItems.push({ nome: itemMatch[2].trim(), quantidade: parseInt(itemMatch[1]) || 1 });
        });
    }
    return data;
}

// --- LÓGICA DE DADOS ---
async function carregarDadosIniciais() {
    try {
        const [resPlayer, resBanco] = await Promise.all([
            fetch('banco_player.json'),
            fetch('banco.json')
        ]);
        if (!resPlayer.ok) throw new Error(`Erro ao carregar banco_player.json: ${resPlayer.status}`);
        todasHuntsBase = await resPlayer.json();
        if (resBanco.ok) {
            try {
                todasContribuicoesGlobais = await resBanco.json();
                if (typeof todasContribuicoesGlobais !== 'object' || todasContribuicoesGlobais === null) {
                    todasContribuicoesGlobais = {};
                }
            } catch (e) { todasContribuicoesGlobais = {}; console.warn("Erro parse banco.json", e); }
        } else { todasContribuicoesGlobais = {}; console.warn("banco.json não encontrado");}

        const savedHuntsBase = localStorage.getItem('todasHuntsBase_sim');
        if (savedHuntsBase) todasHuntsBase = JSON.parse(savedHuntsBase);
        const savedContribuicoes = localStorage.getItem('todasContribuicoesGlobais_sim');
        if (savedContribuicoes) todasContribuicoesGlobais = JSON.parse(savedContribuicoes);
        
        combinarDadosDeHunts();
        document.getElementById('resultados-cards').innerHTML = '<p>Use os filtros acima e clique em "Buscar Hunts" para ver os resultados.</p>';

        const btnAdmin = document.getElementById('btnModoAdmin');
        if(btnAdmin) {
            btnAdmin.addEventListener('click', () => {
                document.getElementById('painelAdmin').style.display = 
                    document.getElementById('painelAdmin').style.display === 'none' ? 'block' : 'none';
            });
        }
        const adminGifFileEl = document.getElementById('adminGifFile');
        const adminGifPreviewEl = document.getElementById('adminGifPreview');
        if (adminGifFileEl && adminGifPreviewEl) {
            adminGifFileEl.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = e => { adminGifPreviewEl.src = e.target.result; adminGifPreviewEl.style.display = 'block'; }
                    reader.readAsDataURL(file);
                } else { adminGifPreviewEl.style.display = 'none'; adminGifPreviewEl.src = '#'; }
            });
        }
    } catch (error) {
        console.error("Falha crítica ao carregar dados iniciais:", error);
        document.getElementById('resultados-cards').innerHTML = '<p>Erro fatal. Tente recarregar.</p>';
    }
}

function combinarDadosDeHunts() {
    huntsCombinadas = todasHuntsBase.map(huntBase => {
        const contribuicoes = todasContribuicoesGlobais[huntBase.nome] || [];
        const recomendacoes = huntBase.recomendacoes_hunt || 'N/A.';
        const gif_url = huntBase.gif_url || null;
        const huntCompleta = { ...huntBase, gif_url, recomendacoes_hunt: recomendacoes, contribuicoes, agregados: {} };
        calcularAgregadosParaHunt(huntCompleta);
        return huntCompleta;
    });
}

function calcularAgregadosParaHunt(hunt) {
    hunt.agregados = {
        media_balanco_ph: 0, media_xp_ph: 0, media_loot_ph: 0, media_supplies_ph: 0,
        media_duracao_sessao_min: 0, media_avaliacao: 0,
        min_balanco_ph: null, max_balanco_ph: null, min_xp_ph: null, max_xp_ph: null,
        min_loot_ph: null, max_loot_ph: null, min_supplies_ph: null, max_supplies_ph: null,
        min_duracao_sessao_min: null, max_duracao_sessao_min: null,
        total_horas_registradas: 0, media_lixo_item_nome: 'N/A', media_lixo_qtd_ph: 0,
        recomendacoes_hunt_base: hunt.recomendacoes_hunt, faixas_skills: {},
        melhores_loots_calculados: []
    };
    const contr = hunt.contribuicoes;
    if (!contr || contr.length === 0) return;
    let sumBalPh=0, sumXpPh=0, sumLootPh=0, sumSupPh=0, sumDurMin=0, sumTotalMin=0, sumAv=0;
    const items={}, skillsCol={}, balArr=[], xpArr=[], lootArr=[], supArr=[], durArr=[];
    contr.forEach(c=>{
        const durH=(c.duracao_min||1)/60, bPh=c.balanco_ph||0, xPh=c.xp_ph||0, lT=c.loot_total_sessao||0, sT=c.supplies_total_sessao||0, dM=c.duracao_min||0;
        sumBalPh+=bPh; sumXpPh+=xPh; const lPh=lT/(durH||1),sPh=sT/(durH||1); sumLootPh+=lPh; sumSupPh+=sPh; sumDurMin+=dM; sumTotalMin+=dM; sumAv+=(c.avaliacao===undefined?.5:c.avaliacao);
        balArr.push(bPh); xpArr.push(xPh); lootArr.push(lPh); supArr.push(sPh); durArr.push(dM);
        (c.itens_lootados_sessao||[]).forEach(it=>{const nL=it.nome.toLowerCase().replace(/^(a|an|some)\s+/,''); if(!items[nL])items[nL]={nO:it.nome,tQ:0,eG:(nL==='gold coin')};items[nL].tQ+=it.quantidade;});
        if(c.vocacao_contribuicao&&c.skills_contribuicao){if(!skillsCol[c.vocacao_contribuicao])skillsCol[c.vocacao_contribuicao]={};for(const sN in c.skills_contribuicao){if(!skillsCol[c.vocacao_contribuicao][sN])skillsCol[c.vocacao_contribuicao][sN]=[];const sV=c.skills_contribuicao[sN];if(typeof sV==='number'&&!isNaN(sV)&&sV!==null)skillsCol[c.vocacao_contribuicao][sN].push(sV);}}});
    const nC=contr.length;if(nC>0){hunt.agregados.media_balanco_ph=sumBalPh/nC;hunt.agregados.media_xp_ph=sumXpPh/nC;hunt.agregados.media_loot_ph=sumLootPh/nC;hunt.agregados.media_supplies_ph=sumSupPh/nC;hunt.agregados.media_duracao_sessao_min=sumDurMin/nC;hunt.agregados.media_avaliacao=sumAv/nC;
    if(balArr.length>0){hunt.agregados.min_balanco_ph=Math.min(...balArr);hunt.agregados.max_balanco_ph=Math.max(...balArr);} if(xpArr.length>0){hunt.agregados.min_xp_ph=Math.min(...xpArr);hunt.agregados.max_xp_ph=Math.max(...xpArr);} if(lootArr.length>0){hunt.agregados.min_loot_ph=Math.min(...lootArr);hunt.agregados.max_loot_ph=Math.max(...lootArr);} if(supArr.length>0){hunt.agregados.min_supplies_ph=Math.min(...supArr);hunt.agregados.max_supplies_ph=Math.max(...supArr);} if(durArr.length>0){hunt.agregados.min_duracao_sessao_min=Math.min(...durArr);hunt.agregados.max_duracao_sessao_min=Math.max(...durArr);}}
    hunt.agregados.total_horas_registradas=sumTotalMin/60;
    for(const v in skillsCol){hunt.agregados.faixas_skills[v]={};for(const sN in skillsCol[v]){const vals=skillsCol[v][sN];if(vals.length>0)hunt.agregados.faixas_skills[v][sN]={min:Math.min(...vals),max:Math.max(...vals)};}}
    const tH=hunt.agregados.total_horas_registradas;hunt.agregados.melhores_loots_calculados=[];if(tH>0){for(const nL in items){const iD=items[nL];const qPh=iD.tQ/tH;hunt.agregados.melhores_loots_calculados.push({nome:iD.nO,qtd_ph:qPh,prata_ph:iD.eG?qPh:0,icone:buscarIconeParaItem(iD.nO)});}
    hunt.agregados.melhores_loots_calculados.sort((a,b)=>{if(a.prata_ph>0&&b.prata_ph===0)return -1;if(b.prata_ph>0&&a.prata_ph===0)return 1;if(a.prata_ph>0&&b.prata_ph>0)return b.prata_ph-a.prata_ph;return b.qtd_ph-a.qtd_ph;});
    let lN='N/A',mQL=0;hunt.agregados.melhores_loots_calculados.forEach(l=>{if(!l.eG&&l.qtd_ph>mQL){mQL=l.qtd_ph;lN=l.nome;}});hunt.agregados.media_lixo_item_nome=lN;hunt.agregados.media_lixo_qtd_ph=mQL;}
    hunt.agregados.melhores_loots_calculados=hunt.agregados.melhores_loots_calculados.slice(0,7);
}

// --- LÓGICA DE FILTRAGEM E EXIBIÇÃO ---
function buscarHunts() {
    paginaAtual = 1;
    const vocacao = document.getElementById('vocacao').value;
    const nivelStr = document.getElementById('nivel').value;
    const nivelJogador = nivelStr ? parseInt(nivelStr) : null;

    const resultadosFiltrados = huntsCombinadas.filter(hunt => {
        let atendeVoc = hunt.vocacoes.includes(vocacao) ||
                        (vocacao === 'Druid' && hunt.vocacoes.some(v => v.includes('Druid') || v.includes('Sorc') || v.includes('Mage')));
        if (vocacao === 'Duo' || vocacao === 'Team') atendeVoc = hunt.vocacoes.includes(vocacao);

        let atendeNivel = true;
        if (nivelJogador !== null) {
            atendeNivel = hunt.nivel_min <= nivelJogador && hunt.nivel_min >= (nivelJogador - 9);
        }

        let atendeTipo = true;
        if (vocacao === 'Duo') atendeTipo = hunt.tipo === 'duo' || hunt.vocacoes.includes('Duo');
        else if (vocacao === 'Team') atendeTipo = hunt.tipo === 'team' || hunt.vocacoes.includes('Team');
        else if (['Knight', 'Paladin', 'Druid', 'Monk'].includes(vocacao)) {
            atendeTipo = hunt.tipo === 'player' || hunt.tipo === 'solo';
        }
        return atendeVoc && atendeNivel && atendeTipo;
    });
    exibirHuntsCompactas(resultadosFiltrados);
}

function mostrarTodasAsHunts() {
    paginaAtual = 1;
    document.getElementById('vocacao').selectedIndex = 0; // Reseta para primeira vocação (ou Knight)
    document.getElementById('nivel').value = '';      // Limpa o nível
    exibirHuntsCompactas(huntsCombinadas);             // Exibe todas sem filtro de nível/voc
}


function exibirHuntsCompactas(listaHunts) {
    const divResultados = document.getElementById('resultados-cards');
    // Remove controles de paginação antigos ANTES de limpar os resultados
    const oldPagination = divResultados.parentNode.querySelector('.pagination-controls');
    if (oldPagination) oldPagination.remove();
    
    divResultados.innerHTML = '';

    if (listaHunts.length === 0) {
        divResultados.innerHTML = '<p>Nenhuma hunt encontrada para os critérios selecionados.</p>';
        return;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const huntsDaPagina = listaHunts.slice(inicio, fim);

    huntsDaPagina.forEach(hunt => {
        const card = document.createElement('div');
        card.className = 'hunt-card';
        card.onclick = () => abrirModalDetalhesHunt(hunt.nome);

        const gifUrl = hunt.gif_url || defaultGif; // Usa default se hunt.gif_url for null/undefined

        card.innerHTML = `
            <div class="hunt-card-content"> 
                <div> 
                    <div class="hunt-card-nome">${hunt.nome}</div>
                    <div class="hunt-card-info">Nível Mín: ${hunt.nivel_min}</div>
                    <div class="hunt-card-info">Vocações: ${hunt.vocacoes.join(', ')}</div>
                    <div class="hunt-card-info">Tipo: ${hunt.tipo}</div>
                </div>
                ${renderEstrelas(hunt.agregados.media_avaliacao, hunt.contribuicoes.length)}
            </div>
            <div class="hunt-card-gif-container">
                <img src="${gifUrl}" alt="${hunt.nome} preview">
            </div>
        `;
        divResultados.appendChild(card);
    });
    renderizarControlesPaginacao(listaHunts.length);
}

function renderizarControlesPaginacao(totalItens) {
    const divResultadosContainer = document.getElementById('resultados-cards').parentNode;
    const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
    if (totalPaginas <= 1) return;

    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-controls';

    if (paginaAtual > 1) {
        const prev =document.createElement('button'); prev.textContent='◀ Ant'; prev.onclick=()=>mudarPagina(paginaAtual-1); paginationContainer.appendChild(prev);
    }
    let iS=Math.max(1,paginaAtual-2),iE=Math.min(totalPaginas,paginaAtual+2); if(paginaAtual<3)iE=Math.min(totalPaginas,5); if(paginaAtual>totalPaginas-2)iS=Math.max(1,totalPaginas-4);
    if(iS>1){const fB=document.createElement('button');fB.textContent='1';fB.onclick=()=>mudarPagina(1);paginationContainer.appendChild(fB);if(iS>2){const d=document.createElement('span');d.textContent='...';d.className='pagination-dots';paginationContainer.appendChild(d);}}
    for(let i=iS;i<=iE;i++){const pB=document.createElement('button');pB.textContent=i;if(i===paginaAtual){pB.disabled=true;pB.classList.add('active');} pB.onclick=()=>mudarPagina(i);paginationContainer.appendChild(pB);}
    if(iE<totalPaginas){if(iE<totalPaginas-1){const d=document.createElement('span');d.textContent='...';d.className='pagination-dots';paginationContainer.appendChild(d);}const lB=document.createElement('button');lB.textContent=totalPaginas;lB.onclick=()=>mudarPagina(totalPaginas);paginationContainer.appendChild(lB);}
    if(paginaAtual<totalPaginas){const next=document.createElement('button');next.textContent='Próx ▶';next.onclick=()=>mudarPagina(paginaAtual+1);paginationContainer.appendChild(next);}
    divResultadosContainer.appendChild(paginationContainer);
}

function mudarPagina(novaPag) {
    paginaAtual = novaPag;
    // A lista completa já foi filtrada por buscarHunts(), agora só re-exibimos a fatia certa
    // Precisamos ter acesso à lista filtrada original. Vamos armazená-la.
    const nivelStr = document.getElementById('nivel').value;
    const vocacao = document.getElementById('vocacao').value;
    // Temporariamente, refazemos o filtro para pegar a lista completa e depois fatiar.
    // O ideal seria guardar 'resultadosFiltradosGlobal'
    const nivelJogador = nivelStr ? parseInt(nivelStr) : null;
    const resultadosFiltrados = huntsCombinadas.filter(hunt => {
        let atendeVoc=hunt.vocacoes.includes(vocacao)||(vocacao==='Druid'&&hunt.vocacoes.some(v=>v.includes('Druid')||v.includes('Sorc')||v.includes('Mage')));if(vocacao==='Duo'||vocacao==='Team')atendeVoc=hunt.vocacoes.includes(vocacao);
        let atendeNivel=true;if(nivelJogador!==null)atendeNivel=hunt.nivel_min<=nivelJogador&&hunt.nivel_min>=(nivelJogador-9);
        let atendeTipo=true;if(vocacao==='Duo')atendeTipo=hunt.tipo==='duo'||hunt.vocacoes.includes('Duo');else if(vocacao==='Team')atendeTipo=hunt.tipo==='team'||hunt.vocacoes.includes('Team');else if(['Knight','Paladin','Druid','Monk'].includes(vocacao))atendeTipo=hunt.tipo==='player'||hunt.tipo==='solo';
        return atendeVoc&&atendeNivel&&atendeTipo;
    });
    exibirHuntsCompactas(resultadosFiltrados);
}


function resetAdminGifInput() {
    const elFile=document.getElementById('adminGifFile'), elPreview=document.getElementById('adminGifPreview');
    if(elFile)elFile.value=''; if(elPreview){elPreview.style.display='none'; elPreview.src='#';}
}

function abrirModalDetalhesHunt(nomeHunt) {
    const hunt = huntsCombinadas.find(h => h.nome === nomeHunt);
    if (!hunt) {
        console.error(`Hunt não encontrada em huntsCombinadas: ${nomeHunt}`);
        return;
    }

    // Atualiza informações para o painel admin (se estiver visível)
    huntSelecionadaAdmin = nomeHunt;
    const adminHuntNameEl = document.getElementById('adminHuntName');
    const adminGifPreviewEl = document.getElementById('adminGifPreview'); // Referência para a prévia

    if (adminHuntNameEl) adminHuntNameEl.textContent = nomeHunt;
    
    resetAdminGifInput(); // Limpa o input de GIF e o preview do painel admin

    // Exibe o GIF atual da hunt no preview do painel admin, se existir e se o elemento de preview for encontrado
    if (hunt.gif_url && adminGifPreviewEl) {
        adminGifPreviewEl.src = hunt.gif_url;
        adminGifPreviewEl.style.display = 'block';
    } else if (adminGifPreviewEl) { 
        adminGifPreviewEl.style.display = 'none';
        adminGifPreviewEl.src = '#'; 
    }
    
    const ag = hunt.agregados;
    const numContr = hunt.contribuicoes.length;
    document.getElementById('detalhesHuntNome').textContent = hunt.nome;

    const formatMinMax = (min, max, isCurrency = false, unit = '') => {
        // ... (função formatMinMax mantida como antes)
        if (numContr > 1 && min !== null && max !== null && min !== max) {
            return ` <small class="stat-min-max">(Min: ${formatNumber(min, isCurrency, 0)}${unit} - Max: ${formatNumber(max, isCurrency, 0)}${unit})</small>`;
        }
        return '';
    };}

function fecharModalDetalhesHunt() {
    document.getElementById('modalDetalhesHunt').style.display = 'none';
    // huntSelecionadaAdmin não é limpo aqui, para que o painel admin mantenha o contexto
}

// --- MODAL DE CONTRIBUIÇÃO ---
function abrirModalContribuicao(nomeHunt) {
    huntAtualParaContribuicao = nomeHunt; avaliacaoParaContribuicao = null;
    document.getElementById('huntModalTitle').textContent = nomeHunt;
    const fieldsToReset = ['sessionData', 'inputLevelContribuicao', 'servidorContribuicao', 'vocacaoContribuicao'];
    fieldsToReset.forEach(id => { const el = document.getElementById(id); if (el) el.value = (id === 'vocacaoContribuicao' || id === 'servidorContribuicao') ? "" : ""; });
    mostrarCamposSkill();
    const btnG = document.getElementById('btn-gostei'), btnNG = document.getElementById('btn-nao-gostei');
    if(btnG) btnG.style.backgroundColor = ''; if(btnG) btnG.classList.remove('selected');
    if(btnNG) btnNG.style.backgroundColor = ''; if(btnNG) btnNG.classList.remove('selected');
    document.getElementById('modalContribuicao').style.display = 'flex';
}
function fecharModalContribuicao() { document.getElementById('modalContribuicao').style.display = 'none';}
function setRatingContribuicao(rating) {
    avaliacaoParaContribuicao=rating;
    const btnG=document.getElementById('btn-gostei'),btnNG=document.getElementById('btn-nao-gostei');
    if(btnG){btnG.style.backgroundColor=rating===1?'var(--cor-rating-gostei)':''; rating===1?btnG.classList.add('selected'):btnG.classList.remove('selected');}
    if(btnNG){btnNG.style.backgroundColor=rating===0?'var(--cor-rating-naogostei)':''; rating===0?btnNG.classList.add('selected'):btnNG.classList.remove('selected');}
}
function mostrarCamposSkill() {
    const voc=document.getElementById('vocacaoContribuicao').value, cont=document.getElementById('camposSkillDinamicos'); cont.innerHTML=''; let camposHTML='';
    switch(voc){case 'Knight':camposHTML=`<label for="skillMeleeKnight">Melee:</label><input type="number" id="skillMeleeKnight" placeholder="Ex:110" min="10"><label for="skillShieldKnight">Shielding:</label><input type="number" id="skillShieldKnight" placeholder="Ex:105" min="10">`;break;case 'Paladin':camposHTML=`<label for="skillDistancePaladin">Distance:</label><input type="number" id="skillDistancePaladin" placeholder="Ex:120" min="10"><label for="skillShieldPaladin">Shielding(Op):</label><input type="number" id="skillShieldPaladin" placeholder="Ex:90" min="10">`;break;case 'Druid':case 'Sorcerer':camposHTML=`<label for="skillMagicLevel">ML:</label><input type="number" id="skillMagicLevel" placeholder="Ex:90" min="0">`;break;case 'Monk':camposHTML=`<label for="skillFistMonk">Fist:</label><input type="number" id="skillFistMonk" placeholder="Ex:100" min="10">`;break;}
    cont.innerHTML=camposHTML;
}
function salvarContribuicao() {
    const sTxt=document.getElementById('sessionData').value,lvl=parseInt(document.getElementById('inputLevelContribuicao').value),srv=document.getElementById('servidorContribuicao').value,vC=document.getElementById('vocacaoContribuicao').value;
    if(!sTxt.trim())return alert('Cole os dados.');if(isNaN(lvl)||lvl<=0)return alert('Level inválido.');if(!srv)return alert('Selecione servidor.');if(avaliacaoParaContribuicao===null)return alert('Avalie.');if(!vC)return alert('Selecione vocação.');
    const sContr={};let sV=true;
    switch(vC){case'Knight':const mS=parseInt(document.getElementById('skillMeleeKnight').value),sK=parseInt(document.getElementById('skillShieldKnight').value);if(isNaN(mS)||isNaN(sK)||mS<10||sK<10)sV=false;else{sContr.meleeSkill=mS;sContr.shieldingSkill=sK;}break;case'Paladin':const dS=parseInt(document.getElementById('skillDistancePaladin').value),sPV=document.getElementById('skillShieldPaladin').value;if(isNaN(dS)||dS<10)sV=false;else{sContr.distanceSkill=dS;if(sPV){const sPI=parseInt(sPV);if(!isNaN(sPI)&&sPI>=10)sContr.shieldingSkill=sPI;else if(sPV.trim()!==''&&(!isNaN(sPI)&&sPI<10))sV=false;}}break;case'Druid':case'Sorcerer':const ml=parseInt(document.getElementById('skillMagicLevel').value);if(isNaN(ml)||ml<0)sV=false;else sContr.magicLevel=ml;break;case'Monk':const fst=parseInt(document.getElementById('skillFistMonk').value);if(isNaN(fst)||fst<10)sV=false;else sContr.fistFighting=fst;break;}
    if(!sV)return alert(`Skills para ${vC} inválidas. Mín:10(ML0). Shield de Pala é opcional, mas se preenchido, min 10.`);
    const p=parseSessionData(sTxt);if(!p.xpPerHour||p.balanceValue===null||!p.sessionDurationMinutes||p.sessionDurationMinutes<=0)return alert('Dados da sessão incompletos.');
    const bPC=(p.balanceValue/(p.sessionDurationMinutes/60)),nC={xp_ph:p.xpPerHour,balanco_ph:bPC,duracao_min:p.sessionDurationMinutes,loot_total_sessao:p.lootValue,supplies_total_sessao:p.suppliesValue,level_personagem:lvl,servidor:srv,avaliacao:avaliacaoParaContribuicao,itens_lootados_sessao:p.lootedItems,monstros_mortos_sessao:p.killedMonsters,data_contribuicao:new Date().toISOString(),vocacao_contribuicao:vC,skills_contribuicao:sContr};
    if(!todasContribuicoesGlobais[huntAtualParaContribuicao])todasContribuicoesGlobais[huntAtualParaContribuicao]=[];todasContribuicoesGlobais[huntAtualParaContribuicao].push(nC);
    localStorage.setItem('todasContribuicoesGlobais_sim',JSON.stringify(todasContribuicoesGlobais));console.log(`Contribuição para ${huntAtualParaContribuicao} salva.`);
    combinarDadosDeHunts();buscarHunts();fecharModalContribuicao();
}

// --- MODAL NOVA HUNT ---
function abrirNovaHuntModal(){const ids=['novaHuntNome','novaHuntLevelMin','novaHuntRecomendacoes'];ids.forEach(id=>document.getElementById(id).value='');document.getElementById('novaHuntVocacaoPrincipal').value='Knight';document.getElementById('novaHuntTipo').value='player';document.getElementById('novaHuntModal').style.display='flex';}
function fecharNovaHuntModal(){document.getElementById('novaHuntModal').style.display='none';}
function salvarNovaHunt(){
    const nome=document.getElementById('novaHuntNome').value.trim(),lvlStr=document.getElementById('novaHuntLevelMin').value,vocP=document.getElementById('novaHuntVocacaoPrincipal').value,tipoH=document.getElementById('novaHuntTipo').value,recom=document.getElementById('novaHuntRecomendacoes').value.trim()||'N/A';
    if(!nome)return alert('Nome obrigatório.');if(!lvlStr||isNaN(parseInt(lvlStr))||parseInt(lvlStr)<=0)return alert('Level mínimo inválido.');const lvlMin=parseInt(lvlStr);
    if(todasHuntsBase.find(h=>h.nome.toLowerCase()===nome.toLowerCase()))return alert('Hunt com este nome já existe.');
    const nHB={nome,nivel_min:lvlMin,vocacoes:[],tipo:tipoH,localizacao:null,recomendacoes_hunt:recom,gif_url:null};
    if(vocP==='Duo'){nHB.vocacoes=['Duo'];nHB.tipo='duo';}else if(vocP==='Team'){nHB.vocacoes=['Team'];nHB.tipo='team';}else{nHB.vocacoes=[vocP];if(vocP==='Druid')nHB.vocacoes.push('Druid/Sorc');nHB.tipo=tipoH;}
    todasHuntsBase.push(nHB);if(!todasContribuicoesGlobais[nome])todasContribuicoesGlobais[nome]=[];
    localStorage.setItem('todasHuntsBase_sim',JSON.stringify(todasHuntsBase));localStorage.setItem('todasContribuicoesGlobais_sim',JSON.stringify(todasContribuicoesGlobais));console.log("Nova hunt base salva:",nHB);
    combinarDadosDeHunts();buscarHunts();fecharNovaHuntModal();
}

// --- PAINEL ADMIN GIF (Simulado) ---
function salvarGifAdmin() {
    if (!huntSelecionadaAdmin)return alert("Abra os detalhes de uma hunt primeiro.");
    const fileInput=document.getElementById('adminGifFile'),file=fileInput.files[0];
    if(!file){if(confirm(`Nenhum arquivo. Remover GIF de '${huntSelecionadaAdmin}'?`))atualizarUrlGifParaHunt(null);return;}
    if(file.type!=="image/gif"){alert("Selecione um GIF.");resetAdminGifInput();return;}
    const caminhoSimulado=`gifs/${file.name}`; // Simulação: Assume que está na pasta gifs/
    atualizarUrlGifParaHunt(caminhoSimulado);resetAdminGifInput();
}
function atualizarUrlGifParaHunt(novaUrl){
    const huntIdx=todasHuntsBase.findIndex(h=>h.nome===huntSelecionadaAdmin);
    if(huntIdx!==-1){
        todasHuntsBase[huntIdx].gif_url=novaUrl;localStorage.setItem('todasHuntsBase_sim',JSON.stringify(todasHuntsBase));
        const huntComb=huntsCombinadas.find(h=>h.nome===huntSelecionadaAdmin);if(huntComb)huntComb.gif_url=novaUrl;
        // Atualiza o card se estiver visível (simplificado: re-renderiza todos os cards da página atual)
        mudarPagina(paginaAtual); // Isso vai chamar exibirHuntsCompactas com a lista filtrada correta
        alert(`GIF para '${huntSelecionadaAdmin}' ${novaUrl?'definido como '+novaUrl:'removido'} (simulado).`);
    }else alert("Erro: Hunt não encontrada.");
}


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', carregarDadosIniciais);