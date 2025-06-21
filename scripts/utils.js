// Arquivo: scripts/utils.js
// Funções utilitárias genéricas

function buscarIconeParaItem(nomeItem) {
    // itemIconMap é esperado ser global (definido em config.js)
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