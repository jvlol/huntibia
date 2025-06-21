// Constantes de Configuração Global
const ITENS_POR_PAGINA = 9;
const MARGEM_NIVEL_FILTRO = 10; // Ajustado: Hunts de nível_min até (nívelJogador - 9) não aparecem se jogador for nível muito alto.
                                          // Se jogador for nível X, mostrar hunts com nível_min >= (X - 9)

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
const defaultGif = "gifs/Kongra.gif"; // Certifique-se que este arquivo existe em sua pasta gifs/