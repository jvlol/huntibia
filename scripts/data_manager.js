// Variáveis globais definidas em main.js: todasHuntsBase, todasContribuicoesGlobais, huntsCombinadas

async function carregarDadosIniciais() {
    try {
        const [resPlayer, resBanco] = await Promise.all([
            fetch('banco_player.json'), // Ajuste o caminho se os JSONs estiverem em outro lugar
            fetch('banco.json')
        ]);
        if (!resPlayer.ok) throw new Error(`Erro ao carregar banco_player.json: ${resPlayer.status}`);
        
        window.todasHuntsBase = await resPlayer.json(); // Atribui à global
        
        if (resBanco.ok) {
            try {
                window.todasContribuicoesGlobais = await resBanco.json();
                if (typeof window.todasContribuicoesGlobais !== 'object' || window.todasContribuicoesGlobais === null) {
                    window.todasContribuicoesGlobais = {};
                }
            } catch (e) { window.todasContribuicoesGlobais = {}; console.warn("Erro parse banco.json", e); }
        } else { window.todasContribuicoesGlobais = {}; console.warn("banco.json não encontrado");}

        const savedHuntsBase = localStorage.getItem('todasHuntsBase_sim');
        if (savedHuntsBase) window.todasHuntsBase = JSON.parse(savedHuntsBase);
        const savedContribuicoes = localStorage.getItem('todasContribuicoesGlobais_sim');
        if (savedContribuicoes) window.todasContribuicoesGlobais = JSON.parse(savedContribuicoes);
        
        combinarDadosDeHunts();
        document.getElementById('resultados-cards').innerHTML = '<p>Use os filtros acima e clique em "Buscar Hunts" para ver os resultados.</p>';

        // Listeners de UI que podem ser movidos para um ui_init.js ou main.js depois de carregar dados
        const btnAdmin = document.getElementById('btnModoAdmin');
        if(btnAdmin) {
            btnAdmin.addEventListener('click', () => {
                const painel = document.getElementById('painelAdmin');
                if (painel) painel.style.display = painel.style.display === 'none' ? 'block' : 'none';
            });
        }
        const adminGifFileEl = document.getElementById('adminGifFile');
        const adminGifPreviewEl = document.getElementById('adminGifPreview');
        if (adminGifFileEl && adminGifPreviewEl) {
            adminGifFileEl.addEventListener('change', function() {
                const file = this.files[0];
                if (file && file.type === "image/gif") { // Adiciona verificação de tipo
                    const reader = new FileReader();
                    reader.onload = e => { adminGifPreviewEl.src = e.target.result; adminGifPreviewEl.style.display = 'block'; }
                    reader.readAsDataURL(file);
                } else {
                    adminGifPreviewEl.style.display = 'none'; adminGifPreviewEl.src = '#';
                    if (file) alert("Por favor, selecione um arquivo GIF."); // Informa o usuário
                    this.value = ''; // Limpa o input se o arquivo não for GIF
                }
            });
        }
    } catch (error) {
        console.error("Falha crítica ao carregar dados iniciais:", error);
        document.getElementById('resultados-cards').innerHTML = '<p>Erro fatal. Tente recarregar.</p>';
    }
}

function combinarDadosDeHunts() {
    // Acessa as globais definidas em main.js
    window.huntsCombinadas = window.todasHuntsBase.map(huntBase => {
        const contribuicoes = window.todasContribuicoesGlobais[huntBase.nome] || [];
        const recomendacoes = huntBase.recomendacoes_hunt || 'Nenhuma recomendação específica fornecida.';
        const gif_url = huntBase.gif_url || null;
        const huntCompleta = { ...huntBase, gif_url, recomendacoes_hunt: recomendacoes, contribuicoes, agregados: {} };
        calcularAgregadosParaHunt(huntCompleta); // Chama a função que estará neste arquivo
        return huntCompleta;
    });
}

function calcularAgregadosParaHunt(hunt) { // hunt é um objeto da lista huntsCombinadas
    // ... (COPIE SUA FUNÇÃO calcularAgregadosParaHunt COMPLETA E FUNCIONAL AQUI)
    // Certifique-se que ela use buscarIconeParaItem() de utils.js corretamente
    // Lembre-se de inicializar hunt.agregados e suas subpropriedades.
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