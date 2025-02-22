function add(){
    var nome = document.querySelector("input#iAt").value;

    if (nome.trim() == ""){
        alert("Por favor, informe um nome")
    } else{
        var tabela = document.querySelector("table#dados"); 
        var novaLinha = tabela.insertRow(); 
        
        var celNome = novaLinha.insertCell(0);
        var celAt = novaLinha.insertCell(1);
        var celAtCer = novaLinha.insertCell(2);
        var celSaq = novaLinha.insertCell(3);
        var celSaqCer = novaLinha.insertCell(4);
        var celDef = novaLinha.insertCell(5);
        var celDefCer = novaLinha.insertCell(6);
        var celPerc = novaLinha.insertCell(7);
    
        // Preencher a linha com valores iniciais
        celNome.textContent = nome;
        celAt.textContent = "0";
        celAtCer.textContent = "0";
        celSaq.textContent = "0";
        celSaqCer.textContent = "0";
        celDef.textContent = "0";
        celDefCer.textContent = "0";

        celAt.contentEditable = "true"
        celAtCer.contentEditable = "true"
        celSaq.contentEditable = "true"
        celSaqCer.contentEditable = "true"
        celDef.contentEditable = "true"
        celDefCer.contentEditable = "true"


        function atualizarPercentual() {
            var at = parseInt(celAt.textContent);
            var atCer = parseInt(celAtCer.textContent);
            var saq = parseInt(celSaq.textContent);
            var saqCer = parseInt(celSaqCer.textContent);
            var def = parseInt(celDef.textContent);
            var defCer = parseInt(celDefCer.textContent);

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

        [celAt, celAtCer, celSaq, celSaqCer, celDef, celDefCer].forEach(cel => {
            cel.addEventListener("input", atualizarPercentual);
        });

        document.querySelector("#iAt").value = ""; // Limpa o campo de input após adicionar
    }
}

function exportarParaExcel() {
    var tabela = document.querySelector("#dados"); // Seleciona a tabela
    var wb = XLSX.utils.book_new(); // Cria um novo arquivo Excel
    var ws = XLSX.utils.table_to_sheet(tabela); // Converte a tabela HTML para uma planilha

    XLSX.utils.book_append_sheet(wb, ws, "Scout de Vôlei"); // Adiciona a planilha ao arquivo
    XLSX.writeFile(wb, "resultado_scout.xlsx"); // Salva e baixa o arquivo
}