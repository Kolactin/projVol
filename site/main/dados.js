function add(){

    var nome = document.querySelector("input#iAt").value;
    var central = document.querySelector("#iCen").checked;
    var ponteiro = document.querySelector("#iPon").checked;
    var oposto = document.querySelector("#iOpo").checked;
    var libero = document.querySelector("#iDef").checked;
    var levantador = document.querySelector("#iLev").checked;
    var funAta = "";

    if (central){
        funAta = "central";
    } 
    if (oposto){
        funAta = "oposto";
    } 
    if (ponteiro){
        funAta = "ponteiro";
    } 
    if (nome.trim() == ""){
        alert("Por favor, informe um nome")
        return;
    }
    
    if (funAta){
        var tabela = document.querySelector("#ata"); 
        var novaLinha = tabela.insertRow(); 
        
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

        [celAt, celAtCer, celSaq, celSaqCer, celPas, celPasCer].forEach(cel => {
            cel.addEventListener("input", atualizarPercentual);
            cel.textContent = 0;
            cel.contentEditable = "true";
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }

    if (levantador){
        var tabela = document.querySelector("#lev"); 
        var novaLinha = tabela.insertRow(); 
        
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

        [celTLev, celLev, celTSaq, celSaq, celTAta, celAta].forEach(cel => {
            cel.addEventListener("input", atualizarPercentual);
            cel.textContent = 0;
            cel.contentEditable = "true";
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }

    if (libero){
        var tabela = document.querySelector("#def"); 
        var novaLinha = tabela.insertRow(); 
        
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

        [celTDef, celDef, celTPas, celPas, celTLev, celLev].forEach(cel => {
            cel.addEventListener("input", atualizarPercentual);
            cel.textContent = 0;
            cel.contentEditable = "true";
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }

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
    }

function exportarParaExcel() {
    var at = document.querySelector("#ata"); // Seleciona a tabela
    var lev = document.querySelector("#lev");
    var def = document.querySelector("#def");
    var excAt = XLSX.utils.book_new(); // Cria um novo arquivo Excel
    var excLev = XLSX.utils.book_new();
    var excDef = XLSX.utils.book_new();
    var planAt = XLSX.utils.table_to_sheet(at); // Converte a tabela HTML para uma planilha
    var planLev = XLSX.utils.table_to_sheet(at);
    var planDef = XLSX.utils.table_to_sheet(at);
    
    XLSX.utils.book_append_sheet(excAt, planAt, "Scout de Vôlei"); // Adiciona a planilha ao arquivo
    XLSX.utils.book_append_sheet(excLev, planLev, "Scout de Vôlei");
    XLSX.utils.book_append_sheet(excDef, planDef, "Scout de Vôlei");
    XLSX.writeFile(excAt, "resultado_Ata.xlsx"); // Salva e baixa o arquivo
    XLSX.writeFile(excLev, "resultado_Lev.xlsx");
    XLSX.writeFile(excDef, "resultado_Def.xlsx");
}