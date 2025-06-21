// Variáveis globais PRINCIPAIS (estado da aplicação)
let todasHuntsBase = [];
let todasContribuicoesGlobais = {};
let huntsCombinadas = []; // Inicializada como array vazio
let huntAtualParaContribuicao = null;
let avaliacaoParaContribuicao = null;
let huntSelecionadaAdmin = null;
let paginaAtual = 1;
let ultimaListaFiltradaGlobal = []; 


// Funções de Lógica Principal / Orquestração de Busca e Paginação
function buscarHunts() {
    console.log("Buscando hunts...");
    window.paginaAtual = 1; 
    const vocacao = document.getElementById('vocacao').value;
    const nivelStr = document.getElementById('nivel').value;
    const nivelJogador = nivelStr ? parseInt(nivelStr) : null;

    // VERIFICAÇÃO IMPORTANTE
    if (!Array.isArray(window.huntsCombinadas)) {
        console.error("buscarHunts chamada mas window.huntsCombinadas não é um array:", window.huntsCombinadas);
        window.ultimaListaFiltradaGlobal = [];
        if (typeof exibirHuntsCompactas === "function") exibirHuntsCompactas(window.ultimaListaFiltradaGlobal);
        return;
    }

    window.ultimaListaFiltradaGlobal = window.huntsCombinadas.filter(hunt => {
        // ... (lógica de filtro como antes) ...
        let atendeVoc = hunt.vocacoes.includes(vocacao) ||
                        (vocacao === 'Druid' && hunt.vocacoes.some(v => v.includes('Druid') || v.includes('Sorc') || v.includes('Mage')));
        if (vocacao === 'Duo' || vocacao === 'Team') atendeVoc = hunt.vocacoes.includes(vocacao);

        let atendeNivel = true;
        if (nivelJogador !== null) {
            atendeNivel = hunt.nivel_min <= nivelJogador && hunt.nivel_min >= (nivelJogador - MARGEM_NIVEL_FILTRO);
        }

        let atendeTipo = true;
        if (vocacao === 'Duo') atendeTipo = hunt.tipo === 'duo' || hunt.vocacoes.includes('Duo');
        else if (vocacao === 'Team') atendeTipo = hunt.tipo === 'team' || hunt.vocacoes.includes('Team');
        else if (['Knight', 'Paladin', 'Druid', 'Monk'].includes(vocacao)) {
            atendeTipo = hunt.tipo === 'player' || hunt.tipo === 'solo';
        }
        return atendeVoc && atendeNivel && atendeTipo;
    });

    if (typeof exibirHuntsCompactas === "function") exibirHuntsCompactas(window.ultimaListaFiltradaGlobal);
    else console.error("Função exibirHuntsCompactas não definida.");
}

function mostrarTodasAsHunts() {
    console.log("Mostrando todas as hunts...");
    window.paginaAtual = 1;
    // VERIFICAÇÃO IMPORTANTE
    if (!Array.isArray(window.huntsCombinadas)) {
        console.error("mostrarTodasAsHunts chamada mas window.huntsCombinadas não é um array:", window.huntsCombinadas);
        window.ultimaListaFiltradaGlobal = [];
        if (typeof exibirHuntsCompactas === "function") exibirHuntsCompactas(window.ultimaListaFiltradaGlobal);
        return;
    }
    window.ultimaListaFiltradaGlobal = [...window.huntsCombinadas]; 
    if (typeof exibirHuntsCompactas === "function") exibirHuntsCompactas(window.ultimaListaFiltradaGlobal);
    else console.error("Função exibirHuntsCompactas não definida.");
}

function mudarPagina(novaPag) {
    window.paginaAtual = novaPag;
    // VERIFICAÇÃO IMPORTANTE
    const listaParaPaginar = window.ultimaListaFiltradaGlobal && Array.isArray(window.ultimaListaFiltradaGlobal) ?
                             window.ultimaListaFiltradaGlobal : 
                             (Array.isArray(window.huntsCombinadas) ? window.huntsCombinadas : []);

    if (typeof exibirHuntsCompactas === "function") {
        exibirHuntsCompactas(listaParaPaginar);
    } else {
        console.error("Função exibirHuntsCompactas não definida.");
    }
}


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Tentando carregar dados iniciais...");
    if (typeof carregarDadosIniciais === "function") {
        carregarDadosIniciais(); // Esta função é ASYNC
    } else {
        console.error("Função carregarDadosIniciais não definida. Verifique data_manager.js e a ordem dos scripts.");
    }
});