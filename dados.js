var c = 0;
var funcao = "";
var tabelAta = tabelaLev = tabelaLib = "";

function add(){

    var nome = document.querySelector("input#iAt").value;
    var central = document.querySelector("#iCen").checked;
    var ponteiro = document.querySelector("#iPon").checked;
    var oposto = document.querySelector("#iOpo").checked;
    var libero = document.querySelector("#iDef").checked;
    var levantador = document.querySelector("#iLev").checked;
    var funAta = "";

    if (central){
        funAta = funcao = "central";
    } else if (oposto){
        funAta = funcao = "oposto";
    } else if (ponteiro){
        funAta = funcao = "ponteiro";
    } 

    if (nome.trim() == ""){
        alert("Por favor, informe um nome")
        return;
    }

    if (funAta){ 
        tabelAta = document.querySelector("#ata");

        var novaLinha = tabelAta.insertRow(); 
        novaLinha.id = ("i"+ nome + funcao);

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
        celPos.textContent = funAta;
        celNotAta.textContent = "X";

        [celAt, celAtCer, celSaq, celSaqCer, celPas, celPasCer, celPerc].forEach(cel => {
            cel.addEventListener("input", atualizarPercentual);
            cel.textContent = 0;
            cel.contentEditable = "true";
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }

    if (levantador){
        funcao = "levantador";
        var tabela = document.querySelector("#lev"); 

        var novaLinha = tabela.insertRow(); 
        novaLinha.id = ("i"+ nome + funcao);

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

        [celTLev, celLev, celTSaq, celSaq, celTAta, celAta, celPerc].forEach(cel => {
            cel.addEventListener("input", atualizarPercentual);
            cel.textContent = 0;
            cel.contentEditable = "true";
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }

    if (libero){
        funcao = "libero";
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
            cel.addEventListener("input", atualizarPercentual);
            cel.textContent = 0;
            cel.contentEditable = "true";
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }

    criarLista(nome, funcao);

        function atualizarPercentual() {
            var at = parseInt(celAt.textContent);
            var atCer = parseInt(celAtCer.textContent);
            var saq = parseInt(celSaq.textContent);
            var saqCer = parseInt(celSaqCer.textContent);
            var def = parseInt(celPas.textContent);
            var defCer = parseInt(celPasCer.textContent);

            var toTent = at + saq + def;
            var totCer = atCer + saqCer + defCer;
            var percentual;

            while (toTent == 0){
                percentual = "";
            }

            if (toTent > 0){
                percentual = ((totCer / toTent) * 100).toFixed(2);
            }
            celPerc.textContent = percentual + "%";
        }

        document.querySelector("#iCen").checked = false;
        document.querySelector("#iPon").checked = false;
        document.querySelector("#iOpo").checked = false;
        document.querySelector("#iLev").checked = false;
        document.querySelector("#iDef").checked = false;
        document.querySelector("#iAt").focus();
    }

function criarLista(nome, funcao){
    c = 0;

    var container = document.querySelector("div#nomesCheck");
    var button = document.createElement("input");

    button.type = "button";
    button.value = nome;
    button.id = ("i" + nome + c);
    
    c++;

    container.appendChild(button);
    container.appendChild(document.createElement("br"));

    button.addEventListener("click", function(){
            butOptions(nome, funcao)
    });
}
    
function butOptions(nome, funcao){
    var acao = document.querySelector("#acao");
    acao.innerHTML = "";

    if (funcao === "central" || funcao === "oposto") {

        var a1 = document.createElement("input");
        var a2 = document.createElement("input");

        [a1, a2].forEach(a => {
            a.type = "button";
        });

        a1.value = "ataque";
        a2.value = "bloqueio";

        acao.appendChild(a1);
        acao.appendChild(a2);

        a1.addEventListener("click",  function(){
            ataque(nome, funcao);
        });

        a2.addEventListener("click", function(){
            bloqueio(nome, funcao);
        });
    } 

    if (funcao === "ponteiro"){
        var a1 = document.createElement("input");
        var a2 = document.createElement("input");
        var a3 = document.createElement("input");
        var a4 = document.createElement("input");

        [a1, a2, a3, a4].forEach(a => {
            a.type = "button";
        });

        a1.value = "ataque";
        a2.value = "bloqueio";
        a3.value = "passe";
        a4.value = "defesa";

        acao.appendChild(a1);
        acao.appendChild(a2);
        acao.appendChild(a3);
        acao.appendChild(a4);

        a1.addEventListener("click",  function(){
            ataque(nome, funcao);
        });

        a2.addEventListener("click",  function(){
            bloqueio(nome, funcao);
        });

        a3.addEventListener("click",  function(){
            passe(nome, funcao);
        });

        a4.addEventListener("click", function(){
            defesa(nome, funcao);
        });
    }
    
    if(funcao == "levantador"){

            var lev1 = document.createElement("input");
            var lev2 = document.createElement("input");
            var lev3 = document.createElement("input");
            var lev4 = document.createElement("input");
            var lev5 = document.createElement("input");

            [lev1, lev2, lev3, lev4, lev5].forEach(lev => {
                lev.type = "button";
            });

            lev1.value = "levantamento";
            lev2.value = "passe";
            lev3.value = "ataque";
            lev4.value = "bloqueio";

            acao.appendChild(lev1);
            acao.appendChild(lev2);
            acao.appendChild(lev3);
            acao.appendChild(lev4);

            lev1.addEventListener("click",  function(){
                levantamento(nome, funcao);
            });

            lev2.addEventListener("click",  function(){
                passe(nome, funcao);
            });

            lev3.addEventListener("click",  function(){
                ataque(nome, funcao);
            });

            lev4.addEventListener("click", function(){
                bloqueio(nome, funcao);
            });
        } 
        
        if(funcao == "libero"){

            var lib1 = document.createElement("input");
            var lib2 = document.createElement("input");
            var lib3 = document.createElement("input");

            [lib1, lib2, lib3, lib4, lib5].forEach(lib => {
                lib.type = "button";
            });

            lib1.value = "Passe";
            lib2.value = "Defesa";
            lib3.value = "Levantamento";

            acao.appendChild(lib1);
            acao.appendChild(lib2);
            acao.appendChild(lib3);

            lib1.addEventListener("click",  function(){
                passe(nome, funcao);
            });

            lib2.addEventListener("click",  function(){
                defesa(nome, funcao);
            });

            lib3.addEventListener("click",  function(){
                levantamento(nome, funcao);
            });
        }
    }

function ataque(nome, funcao){
    var idDaTabela = "i" + nome + funcao;
    
    if (funcao == "central" || funcao == "ponteiro" || funcao == "oposto"){
        var tabela = document.querySelector("#" + idDaTabela);
        
        var atCer = tabela.cells[3];
        var ata = tabela.cells[2];
    }
    
    if (funcao == "levantador"){
        var tabela = document.querySelector("#" + idDaTabela);
        var atCer = tabela.cells[5];
        var ata = tabela.cells[4];
    }

    atCer.textContent = Number(atCer.textContent) + 1;
    ata.textContent = Number(ata.textContent) + 1; 
}

function levantamento(nome){

}

function defesa(nome){

}

function passe(nome){

}

function addCasa(){
    var placarCasa = document.querySelector("#iCasa");

    var placar = Number(placarCasa.value) + 1;

    placarCasa.value = placar;
}

function addFora(){
    var placarFora = document.querySelector("#iFora");

    var placar = Number(placarFora.value) + 1;

    placarFora.value = placar;
}

function remCasa(){
    var placarCasa = document.querySelector("#iCasa");

    var placar = Number(placarCasa.value) - 1;

    placarCasa.value = placar;
}

function remFora(){
    var placarFora = document.querySelector("#iFora");

    var placar = Number(placarFora.value) - 1;

    placarFora.value = placar;
}

function exportarParaExcel() {
    var at = document.querySelector("#ata"); // Seleciona a tabela
    var lev = document.querySelector("#lev");
    var def = document.querySelector("#def");
    var excAt = XLSX.utils.book_new(); // Cria um novo arquivo Excel
    var excLev = XLSX.utils.book_new();
    var excDef = XLSX.utils.book_new();
    var planAt = XLSX.utils.table_to_sheet(at); // Converte a tabela HTML para uma planilha
    var planLev = XLSX.utils.table_to_sheet(lev);
    var planDef = XLSX.utils.table_to_sheet(def);
    
    XLSX.utils.book_append_sheet(excAt, planAt, "Scout de Vôlei"); // Adiciona a planilha ao arquivo
    XLSX.utils.book_append_sheet(excLev, planLev, "Scout de Vôlei");
    XLSX.utils.book_append_sheet(excDef, planDef, "Scout de Vôlei");
    XLSX.writeFile(excAt, "resultado_Ata.xlsx"); // Salva e baixa o arquivo
    XLSX.writeFile(excLev, "resultado_Lev.xlsx");
    XLSX.writeFile(excDef, "resultado_Def.xlsx");
}