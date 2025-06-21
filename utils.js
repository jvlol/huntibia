// Constantes de configuração que são usadas pelas funções utilitárias ou são globais
const MARGEM_NIVEL_INFERIOR_RELEVANTE = 40; // Se usada apenas em buscarHunts, poderia ficar no main_script
const MARGEM_NIVEL_SUPERIOR_RECOMENDADO = 35; // Idem
const ITENS_POR_PAGINA = 9; // Usado na paginação, pode ficar no main_script ou aqui se as func de pag forem para utils

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

function resetAdminGifInput() {
    const elFile=document.getElementById('adminGifFile'), elPreview=document.getElementById('adminGifPreview');
    if(elFile)elFile.value=''; if(elPreview){elPreview.style.display='none'; elPreview.src='#';}
}