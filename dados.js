var c = 0;
var funcao = "";
var pos = "";

function add() {
    var nome = document.querySelector("input#iAt").value.trim();
    var central = document.querySelector("#iCen").checked;
    var ponteiro = document.querySelector("#iPon").checked;
    var oposto = document.querySelector("#iOpo").checked;
    var libero = document.querySelector("#iDef").checked;
    var levantador = document.querySelector("#iLev").checked;

    if (!nome) {
        alert("Por favor, informe um nome");
        return;
    }

    if (central) funcao = "central";
    else if (oposto) funcao = "oposto";
    else if (ponteiro) funcao = "ponteiro";
    else if (levantador) funcao = "levantador";
    else if (libero) funcao = "libero";

    if (!funcao) return;

    if (funcao === "central" || funcao === "oposto" || funcao === "ponteiro") {
        criarLinhaAtaque(nome, funcao);
    } else if (funcao === "levantador") {
        criarLinhaLev(nome, funcao);
    } else if (funcao === "libero") {
        criarLinhaDef(nome, funcao);
    }

    posAtleta(nome);

    // reset checkboxes e input
    document.querySelectorAll("#iCen, #iPon, #iOpo, #iLev, #iDef").forEach(chk => chk.checked = false);
    document.querySelector("#iAt").value = "";
    document.querySelector("#iAt").focus();
}

/* ------------------------
   Funções para cada tabela
-------------------------*/
function criarLinhaAtaque(nome, funcao) {
    var tabelAta = document.querySelector("#ata");
    var novaLinha = tabelAta.insertRow();
    novaLinha.id = "i" + nome + funcao;

    var celNome = novaLinha.insertCell(0);
    var celPos = novaLinha.insertCell(1);
    var celAt = novaLinha.insertCell(2);
    var celAtCer = novaLinha.insertCell(3);
    var celNotAta = novaLinha.insertCell(4);
    var celSaq = novaLinha.insertCell(5);
    var celSaqCer = novaLinha.insertCell(6);
    var celPas = novaLinha.insertCell(7);
    var celPasCer = novaLinha.insertCell(8);
    var celPerc = novaLinha.insertCell(9);

    celNome.textContent = nome;
    celPos.textContent = funcao;
    celNotAta.textContent = "X";

    [celAt, celAtCer, celSaq, celSaqCer, celPas, celPasCer, celPerc].forEach(cel => {
        cel.textContent = 0;
        cel.addEventListener("input", () => atualizarPercentual(novaLinha));
    });
}

function criarLinhaLev(nome, funcao) {
    var tabela = document.querySelector("#lev");
    var novaLinha = tabela.insertRow();
    novaLinha.id = "i" + nome + funcao;

    var celNome = novaLinha.insertCell(0);
    var celTLev = novaLinha.insertCell(1);
    var celLev = novaLinha.insertCell(2);
    var celNotaLev = novaLinha.insertCell(3);
    var celTAta = novaLinha.insertCell(4);
    var celAta = novaLinha.insertCell(5);
    var celTSaq = novaLinha.insertCell(6);
    var celSaq = novaLinha.insertCell(7);
    var celPerc = novaLinha.insertCell(8);

    celNome.textContent = nome;
    celNotaLev.textContent = "X";

    [celTLev, celLev, celTAta, celAta, celTSaq, celSaq, celPerc].forEach(cel => {
        cel.textContent = 0;
        cel.addEventListener("input", () => atualizarPercentual(novaLinha));
    });
}

function criarLinhaDef(nome, funcao) {
    var tabela = document.querySelector("#def");
    var novaLinha = tabela.insertRow();
    novaLinha.id = "i" + nome + funcao;

    var celNome = novaLinha.insertCell(0);
    var celTDef = novaLinha.insertCell(1);
    var celDef = novaLinha.insertCell(2);
    var celNotaDef = novaLinha.insertCell(3);
    var celTPas = novaLinha.insertCell(4);
    var celPas = novaLinha.insertCell(5);
    var celTLev = novaLinha.insertCell(6);
    var celLev = novaLinha.insertCell(7);
    var celPerc = novaLinha.insertCell(8);

    celNome.textContent = nome;
    celNotaDef.textContent = "X";

    [celTDef, celDef, celTPas, celPas, celTLev, celLev, celPerc].forEach(cel => {
        cel.textContent = 0;
        cel.addEventListener("input", () => atualizarPercentual(novaLinha));
    });
}

/* ------------------------
   Atualização percentual
-------------------------*/
function atualizarPercentual(linha) {
    var valores = Array.from(linha.cells).map(c => parseInt(c.textContent) || 0);

    // tenta identificar colunas (bem simplificado)
    var totalTentativas = valores.slice(2, 8).reduce((a, b) => a + b, 0);
    var totalCertos = valores[3] + valores[6] + valores[8] || 0;

    var percentual = totalTentativas > 0 ? ((totalCertos / totalTentativas) * 100).toFixed(2) + "%" : "";
    linha.cells[linha.cells.length - 1].textContent = percentual;
}

/* ------------------------
   Placar
-------------------------*/

const placar = document.getElementById("placar");

// Histórico de pontos, cada item é 'Casa' ou 'Fora'
let historico = [];

function atualizarPlacar() {
  // Limpa todos os quadrados
  placar.innerHTML = "";

  // Cria um quadrado para cada ponto no histórico
  historico.forEach(time => {
    const q = document.createElement("div");
    q.classList.add("quadrado");
    if (time === "Casa") q.classList.add("casa");
    if (time === "Fora") q.classList.add("fora");
    placar.appendChild(q);
  });
}

function addPonto(time) {
  historico.push(time);
  atualizarPlacar();
}


/* ------------------------
   Exportar Excel
-------------------------*/
function exportarParaExcel() {
    var wb = XLSX.utils.book_new();

    [["ata", "Atacantes"], ["lev", "Levantadores"], ["def", "Liberos"]].forEach(([id, nome]) => {
        var tabela = document.querySelector("#" + id);
        var planilha = XLSX.utils.table_to_sheet(tabela);
        XLSX.utils.book_append_sheet(wb, planilha, nome);
    });

    XLSX.writeFile(wb, "resultado_scout.xlsx");
}
