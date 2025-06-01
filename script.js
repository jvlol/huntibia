// Seu script.js existente...

// Variáveis globais e carregarTodosOsDados() permanecem iguais...
let hunts = [];
let contribHunt = null;
let contribRating = null;
let modo = "vip";
let itemUrlOverrides = {};

function carregarTodosOsDados() {
  const promises = [
    fetch("banco_player.json").then(r => r.json()).catch(e => { console.error("Erro ao carregar banco_player.json:", e); return []; }),
    fetch("banco.json").then(r => r.json()).catch(e => { console.error("Erro ao carregar banco.json:", e); return []; }),
    fetch("image_overrides.json").then(r => r.json()).catch(e => { console.error("Erro ao carregar image_overrides.json:", e); return {}; })
  ];

  return Promise.all(promises)
    .then(([playerHunts, bancoHunts, loadedOverrides]) => {
      const todasAsHuntsBrutas = (playerHunts || []).concat(bancoHunts || []);
      hunts = todasAsHuntsBrutas.flat().filter(h => h && typeof h === 'object' && h.nome);
      itemUrlOverrides = loadedOverrides || {};
      buscarHunts();
      document.getElementById("btn-nova-hunt").style.display = "inline-block";
      document.getElementById("vocacao").style.display = "inline-block";
    })
    .catch(error => {
      console.error("Erro crítico ao carregar dados iniciais:", error);
      document.getElementById("resultados").innerHTML = "<p>Erro crítico ao carregar os dados do aplicativo. Tente recarregar a página ou contate o suporte.</p>";
    });
}

function buscarHunts() {
  let vocacao = document.getElementById("vocacao").value.trim().toLowerCase();
  if (vocacao === "druid" || vocacao === "sorcerer") vocacao = "mage";

  const nivelInput = document.getElementById("nivel").value.trim();
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "";

  if (!hunts || hunts.length === 0) {
    resultadosDiv.innerHTML = "<p>Nenhuma hunt carregada no sistema. Verifique os arquivos JSON.</p>";
    return;
  }

  if (nivelInput === "") {
    resultadosDiv.innerHTML = "<p>Por favor, digite seu level.</p>";
    return;
  }
  const nivel = parseInt(nivelInput);
  if (isNaN(nivel) || nivel <= 0) {
    resultadosDiv.innerHTML = "<p>Digite um level válido (número maior que zero).</p>";
    return;
  }

  const huntsFiltradasPorVocacao = hunts.filter(h => h.vocacoes && Array.isArray(h.vocacoes) && h.vocacoes.some(v => typeof v === 'string' && v.toLowerCase().includes(vocacao)));

  if (huntsFiltradasPorVocacao.length === 0) {
    resultadosDiv.innerHTML = `<p>Nenhuma hunt encontrada para a vocação: ${document.getElementById("vocacao").value}.</p>`;
    return;
  }

  const faixas = [...new Set(huntsFiltradasPorVocacao.map(h => h.nivel_min).filter(n => typeof n === "number"))].sort((a, b) => a - b);
  const faixaSelecionada = [...faixas].reverse().find(min => nivel >= min);

  if (faixaSelecionada === undefined) {
    resultadosDiv.innerHTML = `<p>Nenhuma hunt disponível para o level ${nivel} nesta vocação. Considere um level diferente ou verifique as hunts existentes.</p>`;
    return;
  }

  const huntsExibiveis = huntsFiltradasPorVocacao.filter(h => h.nivel_min === faixaSelecionada);

  if (huntsExibiveis.length === 0) {
    resultadosDiv.innerHTML = "<p>Nenhuma hunt encontrada para a combinação específica de level e vocação nesta faixa.</p>";
    return;
  }

  huntsExibiveis.forEach(hunt => {
    const row = document.createElement("div");
    row.className = "hunt-row";

    const contribs = hunt.contribuicoes || [];
    const xpArr = contribs.map(c => c.xp).filter(n => n && !isNaN(parseFloat(n))).map(n => parseFloat(n));
    const goldArr = contribs.map(c => c.gold).filter(n => n !== undefined && n !== null && !isNaN(parseFloat(n))).map(n => parseFloat(n));
    const ratingArr = contribs.map(c => c.avaliacao).filter(n => n !== null && n !== undefined && (n === 0 || n === 1));

    const mediaXp = xpArr.length ? (xpArr.reduce((a, b) => a + b, 0) / xpArr.length).toFixed(0) : "-";
    const minXp = xpArr.length ? Math.min(...xpArr) : "-";
    const maxXp = xpArr.length ? Math.max(...xpArr) : "-";

    const mediaGold = goldArr.length ? (goldArr.reduce((a, b) => a + b, 0) / goldArr.length).toFixed(0) : "-";
    const minGold = goldArr.length ? Math.min(...goldArr) : "-";
    const maxGold = goldArr.length ? Math.max(...goldArr) : "-";

    const nota = ratingArr.length ? ratingArr.reduce((a, b) => a + b, 0) / ratingArr.length : 0;
    const estrelas = gerarEstrelas(nota);

    const dropIcons = (hunt.drops || []).map(item => {
      let url;
      if (itemUrlOverrides && itemUrlOverrides[item]) {
        url = itemUrlOverrides[item];
      } else {
        const nomeArquivo = String(item).replace(/ /g, "_");
        url = `https://www.tibiawiki.com.br/images/${nomeArquivo}.gif`;
      }
      return `<img src="${url}" title="${item}" alt="${item}" onerror="this.style.display='none';">`;
    }).join("");

    // SEU INNERHTML ATUAL - NÃO MEXER AQUI DIRETAMENTE
    row.innerHTML = `
        <div class="hunt-name">${hunt.nome || 'Nome Indefinido'}</div>
        <div class="hunt-drops">${dropIcons}</div>
        <div class="hunt-stats">
        <div class="stat"> 
            <label>XP Range</label>
            <span>${minXp.toLocaleString()} ~ ${maxXp.toLocaleString()}</span>
            <small>Média: ${mediaXp.toLocaleString()} xp/h</small>
        </div>
        <div class="stat"> 
            <label>Gold Range</label>
            <span>${minGold.toLocaleString()} ~ ${maxGold.toLocaleString()}</span>
            <small>Média: ${mediaGold.toLocaleString()} gp/h</small>
        </div>
        </div>
        <div class="hunt-stars">${estrelas}</div>
        <div class="hunt-info">[${(hunt.tipo || 'TIPO').toUpperCase()}] - Lv.${hunt.nivel_min || '?'}</div>
        <button onclick='abrirModal(${JSON.stringify(hunt).replace(/'/g, "\\'")})'>Contribuir</button>
        <button onclick='mostrarPorServidor(${JSON.stringify(hunt).replace(/'/g, "\\'")})'>🔍 Por Servidor</button> 
    `;

    // ----- MODIFICAÇÕES NO DOM APÓS A CRIAÇÃO DO INNERHTML -----
    const statDivs = row.querySelectorAll(".hunt-stats .stat");
    if (statDivs.length >= 2) {
        // Adiciona clique ao bloco de XP
        statDivs[0].classList.add("stat-clickable"); // Adiciona classe para estilo hover no CSS
        statDivs[0].onclick = () => abrirModalMetricas(hunt, "xp");

        // Adiciona clique ao bloco de Gold
        statDivs[1].classList.add("stat-clickable"); // Adiciona classe para estilo hover no CSS
        statDivs[1].onclick = () => abrirModalMetricas(hunt, "gold");
    }

    // Remove ou esconde o botão "Por Servidor"
    // É mais seguro selecionar por uma parte do seu atributo onclick
    const btnPorServidor = row.querySelector('button[onclick*="mostrarPorServidor"]');
    if (btnPorServidor) {
        btnPorServidor.style.display = "none"; // Ou btnPorServidor.remove();
    }
    // -------------------------------------------------------------

    if (hunt.melhores_loots && Array.isArray(hunt.melhores_loots) && hunt.melhores_loots.length > 0) {
        const lootsDiv = document.createElement("div");
        lootsDiv.className = "melhores-loots";
        lootsDiv.innerHTML = `
        <div class="loots-title">Melhores loots:</div>
        <div class="loots-list">
            ${hunt.melhores_loots.map(loot => {
                if (!loot || typeof loot !== 'object' || !loot.nome) return '';
                let lootImageUrl;
                if (itemUrlOverrides && itemUrlOverrides[loot.nome]) {
                    lootImageUrl = itemUrlOverrides[loot.nome];
                } else {
                    lootImageUrl = `https://www.tibiawiki.com.br/images/${String(loot.nome).replace(/ /g, "_")}.gif`;
                }
                const valorK = typeof loot.valor === 'number' ? (loot.valor / 1000).toFixed(0) : '-';
                const chance = typeof loot.chance === 'number' ? loot.chance : '-';
                return `
                <div class="loot-item">
                    <img src="${lootImageUrl}" alt="${loot.nome}" onerror="this.style.display='none'">
                    <div class="loot-info">
                    <strong>${loot.nome}</strong>
                    <div>
                        <span class="loot-valor">${valorK}k</span>
                        <span class="loot-chance">${chance}%</span>
                    </div>
                    </div>
                </div>`
            }).join("")}
        </div>
        `;
        row.appendChild(lootsDiv);
    }
    resultadosDiv.appendChild(row);
  });
}

function gerarEstrelas(nota) {
  const total = 5;
  const inteira = Math.floor(nota);
  const fracao = nota - inteira;
  let estrelas = "★".repeat(inteira);

  if (fracao >= 0.25 && fracao < 0.75) {
    estrelas += "⯪";
  } else if (fracao >= 0.75) {
    estrelas += "★";
  }
  estrelas = estrelas.padEnd(total, "☆");
  return estrelas;
}

// NOVA FUNÇÃO (ou modificada de mostrarPorServidor)
function abrirModalMetricas(hunt, tipoMetrica) {
    console.log("Abrindo métricas para:", hunt.nome, "Tipo:", tipoMetrica);
    const contribs = hunt.contribuicoes || [];
    if (contribs.length === 0) {
        alert(`Nenhuma contribuição registrada para ${hunt.nome} para mostrar métricas de ${tipoMetrica.toUpperCase()}.`);
        return;
    }

    const porServidor = {};
    contribs.forEach(c => {
        if (!c.servidor) return;

        let valorMetrica;
        if (tipoMetrica === "xp" && c.xp !== undefined && !isNaN(parseFloat(c.xp))) {
            valorMetrica = parseFloat(c.xp);
        } else if (tipoMetrica === "gold" && c.gold !== undefined && !isNaN(parseFloat(c.gold))) {
            valorMetrica = parseFloat(c.gold);
        } else {
            return;
        }

        if (!porServidor[c.servidor]) {
            porServidor[c.servidor] = { valores: [], niveis: [] };
        }
        porServidor[c.servidor].valores.push(valorMetrica);
        if (c.level_personagem && !isNaN(parseInt(c.level_personagem))) {
            porServidor[c.servidor].niveis.push(parseInt(c.level_personagem));
        }
    });

    if (Object.keys(porServidor).length === 0) {
        alert(`Nenhum dado de ${tipoMetrica.toUpperCase()}/h encontrado nas contribuições para ${hunt.nome}.`);
        return;
    }

    let tituloModal = `${tipoMetrica.toUpperCase()}/h por servidor – ${hunt.nome}`;
    let conteudoHtml = `<div class="metricas-servidor-lista">`;

    for (const server in porServidor) {
        const listaValores = porServidor[server].valores;
        const listaNiveis = porServidor[server].niveis;

        if (listaValores.length === 0) continue;

        const media = (listaValores.reduce((a, b) => a + b, 0) / listaValores.length);
        const min = Math.min(...listaValores);
        const max = Math.max(...listaValores);
        
        let faixaLevel = "";
        if (listaNiveis.length > 0) {
            const minLvl = Math.min(...listaNiveis);
            const maxLvl = Math.max(...listaNiveis);
            faixaLevel = (minLvl === maxLvl) ? ` (Lv. ${minLvl})` : ` (Lv. ${minLvl}~${maxLvl})`;
        }

        conteudoHtml += `
            <div class="metrica-servidor-item">
                <h4>${server}${faixaLevel}</h4>
                <p>Range: ${min.toLocaleString(undefined, {maximumFractionDigits:0})} ~ ${max.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                <p>Média: ${media.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                <small>Contribuições: ${listaValores.length}</small>
            </div>
        `;
    }
    conteudoHtml += `</div>`;

    exibirModalGenerico(tituloModal, conteudoHtml);
}

// Função auxiliar para um modal genérico (você PRECISA ter o HTML para ele no index.html)
function exibirModalGenerico(titulo, conteudoHtml) {
    const modalGenerico = document.getElementById("modalGenerico"); // <<<< Tenta pegar o elemento
    if (!modalGenerico) { 
        console.error("Elemento #modalGenerico não encontrado no DOM.");
        alert("Erro: Modal de métricas não pôde ser exibido."); // <<<< ESTE É O SEU ALERT
        return;
    }
    const tituloEl = modalGenerico.querySelector(".modal-titulo");
    const conteudoEl = modalGenerico.querySelector(".modal-corpo");
    const btnFechar = modalGenerico.querySelector(".btn-fechar-modal");

    if (tituloEl) tituloEl.textContent = titulo;
    else console.warn(".modal-titulo não encontrado dentro de #modalGenerico");

    if (conteudoEl) conteudoEl.innerHTML = conteudoHtml;
    else console.warn(".modal-corpo não encontrado dentro de #modalGenerico");
    
    if(btnFechar) {
        btnFechar.onclick = () => modalGenerico.style.display = "none";
    } else {
        console.warn(".btn-fechar-modal não encontrado dentro de #modalGenerico");
        // Adiciona um ouvinte de clique no próprio modal para fechar, como fallback
        modalGenerico.onclick = (e) => {
            if (e.target === modalGenerico) { // Fecha se clicar no fundo escuro
                modalGenerico.style.display = "none";
            }
        };
    }
    modalGenerico.style.display = "flex";
}


// A função mostrarPorServidor original não é mais chamada pelos botões,
// mas abrirModalMetricas agora tem a lógica dela. Você pode remover mostrarPorServidor.
/*
function mostrarPorServidor(hunt) {
  // ...código antigo...
}
*/

// Funções de modal (abrirModal, fecharModal, setRating, salvarContribuicao) permanecem as mesmas...
// Funções de nova hunt (abrirNovaHunt, fecharNovaHunt, salvarNovaHunt) permanecem as mesmas...
// Chamada carregarTodosOsDados() no final permanece a mesma...

// Funções de Modal (abrirModal, fecharModal) - SEM MUDANÇAS
function abrirModal(hunt) {
  contribHunt = hunt;
  contribRating = null;
  document.getElementById("inputXp").value = "";
  document.getElementById("inputGold").value = "";
  document.getElementById("inputLevel").value = "";
  document.getElementById("servidor").value = "";
  document.getElementById("btn-gostei").style.backgroundColor = "";
  document.getElementById("btn-nao-gostei").style.backgroundColor = "";
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// Funções de Rating e Salvar Contribuição - SEM MUDANÇAS
function setRating(valor) {
  contribRating = valor;
  const btnGostei = document.getElementById("btn-gostei");
  const btnNaoGostei = document.getElementById("btn-nao-gostei");
  btnGostei.style.backgroundColor = (valor === 1) ? "#007bff" : "";
  btnNaoGostei.style.backgroundColor = (valor === 0) ? "#dc3545" : "";
}

function salvarContribuicao() {
  const xpInput = document.getElementById("inputXp").value;
  const goldInput = document.getElementById("inputGold").value;
  const servidor = document.getElementById("servidor").value;
  const levelInput = document.getElementById("inputLevel").value;

  if (!contribHunt) {
    alert("Erro: Hunt não selecionada."); return;
  }
  if (xpInput === "" || isNaN(parseInt(xpInput)) || parseInt(xpInput) <= 0) {
    alert("Por favor, insira um valor de XP/h válido (maior que zero)."); return;
  }
  if (goldInput === "" || isNaN(parseInt(goldInput))) {
    alert("Por favor, insira um valor de Gold/h válido."); return;
  }
  if (levelInput === "" || isNaN(parseInt(levelInput)) || parseInt(levelInput) <= 0) {
    alert("Por favor, insira seu level (maior que zero)."); return;
  }
  if (servidor === "") {
    alert("Por favor, selecione um servidor."); return;
  }
  if (contribRating === null) {
    alert("Por favor, avalie a hunt (Gostei/Não Gostei)."); return;
  }

  const envio = {
    nome_hunt: contribHunt.nome,
    xp: parseInt(xpInput),
    gold: parseInt(goldInput),
    servidor: servidor,
    level_personagem: parseInt(levelInput),
    avaliacao: contribRating
  };

  fetch("salvar.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envio)
  })
  .then(r => {
    if (!r.ok) {
      return r.text().then(text => { throw new Error(`HTTP error! status: ${r.status}, message: ${text || 'No error message from server.'}`) });
    }
    return r.json();
  })
  .then(data => {
    if (data.success) {
      alert("Contribuição salva com sucesso!");
      fecharModal();
      carregarTodosOsDados(); // Recarrega todos os dados para refletir a mudança
    } else {
      alert("Erro ao salvar contribuição: " + (data.message || "Erro desconhecido do servidor."));
    }
  })
  .catch(error => {
    console.error("Erro ao salvar contribuição:", error);
    alert(`Erro ao conectar com o servidor para salvar contribuição. Detalhes: ${error.message}`);
  });
}

// Funções de Nova Hunt - SEM MUDANÇAS
function abrirNovaHunt() {
  document.getElementById("novaHuntNome").value = "";
  document.getElementById("novaHuntLevel").value = "";
  document.getElementById("novaHuntVocacao").value = "Knight";
  document.getElementById("novaHuntTipo").value = "solo";
  document.getElementById("novaHuntModal").style.display = "flex";
}

function fecharNovaHunt() {
  document.getElementById("novaHuntModal").style.display = "none";
}

function salvarNovaHunt() {
  const nome = document.getElementById("novaHuntNome").value.trim();
  const nivelMinInput = document.getElementById("novaHuntLevel").value;
  const voc = document.getElementById("novaHuntVocacao").value;
  const tipo = document.getElementById("novaHuntTipo").value;

  if (!nome || nome.length < 3) {
    alert("Nome da hunt inválido ou muito curto (mínimo 3 caracteres)."); return;
  }
  if (nivelMinInput === "" || isNaN(parseInt(nivelMinInput)) || parseInt(nivelMinInput) <= 0) {
    alert("Level mínimo inválido (deve ser um número maior que zero)."); return;
  }

  const novaHunt = {
    nome: nome,
    nivel_min: parseInt(nivelMinInput),
    vocacoes: [voc.toLowerCase()],
    tipo: tipo,
    contribuicoes: [],
    drops: [],
    melhores_loots: []
  };

  fetch("salvar_nova_hunt.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novaHunt)
  })
  .then(r => {
    if (!r.ok) {
      return r.text().then(text => { throw new Error(`HTTP error! status: ${r.status}, message: ${text || 'No error message from server.'}`) });
    }
    return r.json();
   })
  .then(data => {
    if (data.success) {
      alert("Nova hunt salva com sucesso!");
      fecharNovaHunt();
      carregarTodosOsDados();
    } else {
      alert("Erro ao salvar nova hunt: " + (data.message || "Erro desconhecido do servidor."));
    }
  }).catch(err => {
    console.error("Erro ao salvar nova hunt:", err);
    alert(`Erro ao conectar com o servidor para salvar nova hunt. Detalhes: ${err.message}`);
  });
}

carregarTodosOsDados();