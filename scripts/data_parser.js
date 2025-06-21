// Em scripts/data_parser.js (VERSÃO DE TESTE SIMPLIFICADA - FOCO NOS BLOCOS)

function parseSessionData(text) {
    console.clear(); 
    console.log("======================================================");
    console.log("INICIANDO TESTE DE PARSE DE BLOCOS - data_parser.js");
    const cleanedText = text.trim().replace(/\r\n/g, '\n');
    console.log("Texto (limpo) recebido para parse (primeiros 1000 chars):\n", cleanedText.substring(0, 1000) + (cleanedText.length > 1000 ? "..." : ""));
    console.log("------------------------------------------------------");

    const data = {
        // Os outros campos (xp, loot, balance etc.) foram omitidos NESTA VERSÃO DE TESTE para focar.
        // Se você os descomentar e as regex deles estiverem ok, eles serão parseados.
        xpPerHour: null, lootValue: null, suppliesValue: null, balanceValue: null, sessionDurationMinutes: null,
        killedMonsters: [],
        lootedItems: []
    };
    let match;

    // Parsers para os campos numéricos (para que a validação principal não falhe totalmente)
    match = cleanedText.match(/XP\/h:\s*([\d,]+)/i);
    if (match && match[1]) data.xpPerHour = parseInt(match[1].replace(/,/g, ''));
    else { match = cleanedText.match(/Raw XP\/h:\s*([\d,]+)/i); if (match && match[1]) data.xpPerHour = parseInt(match[1].replace(/,/g, '')); }
    match = cleanedText.match(/Loot:\s*([\d,]+)/i); if (match && match[1]) data.lootValue = parseInt(match[1].replace(/,/g, ''));
    match = cleanedText.match(/Supplies:\s*([\d,]+)/i); if (match && match[1]) data.suppliesValue = parseInt(match[1].replace(/,/g, ''));
    match = cleanedText.match(/Balance:\s*([-\d,]+)/i);
    if (match && match[1]) data.balanceValue = parseInt(match[1].replace(/,/g, ''));
    else if (data.lootValue !== null && data.suppliesValue !== null) data.balanceValue = data.lootValue - data.suppliesValue;
    match = cleanedText.match(/Session:\s*(\d+):(\d{2})/i); if (match && match[1] && match[2]) data.sessionDurationMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);


    // Teste para KILLED MONSTERS
    console.log("\n--- TENTANDO 'Killed Monsters:' ---");
    // Regex tenta capturar tudo após "Killed Monsters:" e uma quebra de linha,
    // até encontrar "Looted Items:" em uma nova linha, OU qualquer linha começando com Palavra:, OU o fim da string.
    const killedMonstersRegex = /Killed Monsters:\s*\n([\s\S]*?)(?=\nLooted Items:|\n\w+[:\s]|$)/im;
    //                                                                                ^ Pequeno ajuste aqui: \w+[:\s] (palavra seguida de : OU espaço)
    match = cleanedText.match(killedMonstersRegex);

    if (match && match[1]) {
        const killedBlockText = match[1].trim();
        console.log("Bloco 'Killed Monsters' CAPTURADO. Conteúdo:\n>>>\n" + killedBlockText + "\n<<<");
        if (killedBlockText) {
            killedBlockText.split('\n').forEach(line => {
                line = line.trim();
                if (line) {
                    const monsterMatch = line.match(/^(\d+)\s*x\s*(.+)/i);
                    if (monsterMatch && monsterMatch[1] && monsterMatch[2]) {
                        data.killedMonsters.push({ nome: monsterMatch[2].trim(), quantidade: parseInt(monsterMatch[1]) });
                    } else {
                        console.log("  [KM] Linha de Monstro NÃO bateu com 'Nx Nome':", `'${line}'`);
                    }
                }
            });
        } else {  console.warn("Bloco 'Killed Monsters' CAPTURADO, mas VAZIO após trim()."); }
    } else {
        console.log("NENHUM bloco 'Killed Monsters' encontrado pela regex. Texto original (início) para killedMonstersRegex:\n" + cleanedText.substring(0, Math.min(cleanedText.length, 500)) + "...");
    }
    console.log("Resultado para data.killedMonsters (final):", JSON.stringify(data.killedMonsters));


    // Teste para LOOTED ITEMS
    console.log("\n--- TENTANDO 'Looted Items:' ---");
    const lootedItemsRegex = /Looted Items:\s*\n([\s\S]*?)(?=\nKilled Monsters:|\n\w+[:\s]|$)/im;
    match = cleanedText.match(lootedItemsRegex);

    if (match && match[1]) {
        const lootedBlockText = match[1].trim();
        console.log("Bloco 'Looted Items' CAPTURADO. Conteúdo:\n>>>\n" + lootedBlockText + "\n<<<");
        if (lootedBlockText) {
            lootedBlockText.split('\n').forEach(line => {
                line = line.trim();
                if (line) {
                    const itemMatch = line.match(/^(?:(\d+)\s*x\s+)?(.+)/i);
                    if (itemMatch && itemMatch[2]) {
                        data.lootedItems.push({ nome: itemMatch[2].trim(), quantidade: parseInt(itemMatch[1]) || 1 });
                    } else {
                         console.log("  [LI] Linha de Item NÃO bateu:", `'${line}'`);
                    }
                }
            });
        } else { console.warn("Bloco 'Looted Items' CAPTURADO, mas VAZIO após trim()."); }
    } else {
        console.log("NENHUM bloco 'Looted Items' encontrado pela regex. Texto original (início) para lootedItemsRegex:\n" + cleanedText.substring(0,Math.min(cleanedText.length, 500)) + "...");
    }
    console.log("Resultado para data.lootedItems (final):", JSON.stringify(data.lootedItems));

    // Valores dummy para evitar o alerta principal de "dados incompletos" DURANTE ESTE TESTE ESPECÍFICO.
    // NÃO FAÇA ISSO EM PRODUÇÃO.
    if (data.xpPerHour === null) data.xpPerHour = 1;
    if (data.balanceValue === null) data.balanceValue = 1;
    if (data.sessionDurationMinutes === null) data.sessionDurationMinutes = 1;

    console.log("--- Fim parseSessionData (com valores dummy para teste, se necessário) ---");
    console.log("Objeto 'data' retornado:", JSON.stringify(data, null, 2));
    return data;
}