// Variáveis globais acessadas: paginaAtual, ITENS_POR_PAGINA, defaultGif, huntsCombinadas
// Funções globais chamadas: abrirModalDetalhesHunt, renderEstrelas, renderizarControlesPaginacao

function exibirHuntsCompactas(listaHunts) {
    const divResultados = document.getElementById('resultados-cards');
    const oldPagination = divResultados.parentNode.querySelector('.pagination-controls');
    if (oldPagination) oldPagination.remove();
    
    divResultados.innerHTML = '';

    if (!listaHunts || listaHunts.length === 0) { // Adicionada verificação para listaHunts
        divResultados.innerHTML = '<p>Nenhuma hunt encontrada para os critérios selecionados.</p>';
        return;
    }

    const inicio = (window.paginaAtual - 1) * ITENS_POR_PAGINA; // Usa global
    const fim = inicio + ITENS_POR_PAGINA;
    const huntsDaPagina = listaHunts.slice(inicio, fim);

    huntsDaPagina.forEach(hunt => {
        const card = document.createElement('div');
        card.className = 'hunt-card';
        card.onclick = () => abrirModalDetalhesHunt(hunt.nome); 
        const gifUrl = hunt.gif_url || defaultGif; // Usa global defaultGif
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
    // Remove controles de paginação antigos ANTES de adicionar novos
    const oldPaginationControls = divResultadosContainer.querySelector('.pagination-controls');
    if(oldPaginationControls) oldPaginationControls.remove();

    const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA); // Usa global
    if (totalPaginas <= 1) return;

    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-controls';

    // Botão Anterior
    if (window.paginaAtual > 1) { // Usa global
        const prev =document.createElement('button'); prev.textContent='◀ Ant'; prev.onclick=()=>mudarPagina(window.paginaAtual-1); paginationContainer.appendChild(prev);
    }
    // Lógica para exibir números de página
    let iS=Math.max(1,window.paginaAtual-2),iE=Math.min(totalPaginas,window.paginaAtual+2); 
    if(window.paginaAtual<3)iE=Math.min(totalPaginas,5); 
    if(window.paginaAtual>totalPaginas-2)iS=Math.max(1,totalPaginas-4);

    if(iS>1){const fB=document.createElement('button');fB.textContent='1';fB.onclick=()=>mudarPagina(1);paginationContainer.appendChild(fB);if(iS>2){const d=document.createElement('span');d.textContent='...';d.className='pagination-dots';paginationContainer.appendChild(d);}}
    for(let i=iS;i<=iE;i++){const pB=document.createElement('button');pB.textContent=i;if(i===window.paginaAtual){pB.disabled=true;pB.classList.add('active');} pB.onclick=()=>mudarPagina(i);paginationContainer.appendChild(pB);}
    if(iE<totalPaginas){if(iE<totalPaginas-1){const d=document.createElement('span');d.textContent='...';d.className='pagination-dots';paginationContainer.appendChild(d);}const lB=document.createElement('button');lB.textContent=totalPaginas;lB.onclick=()=>mudarPagina(totalPaginas);paginationContainer.appendChild(lB);}
    
    // Botão Próximo
    if(window.paginaAtual<totalPaginas){const next=document.createElement('button');next.textContent='Próx ▶';next.onclick=()=>mudarPagina(window.paginaAtual+1);paginationContainer.appendChild(next);}
    
    divResultadosContainer.appendChild(paginationContainer);
}