function Filtrar(obj) {
	obj = $(obj); //evita o bug do IE
	obj = obj.up('div'); // div principal que contem todos os outros elementos

	var txtInput = obj.down('input.tfText');
	var opPalavraInteira = obj.down('input.tfPalavraInteira');
	var opCaseSensitive = obj.down('input.tfCaseSensitive');
	var spFilterMsg = obj.down('*.tfMsg');

	var tableContainer = obj.up('table').down('table');
	
	if (!tableContainer) return false;

	var tbodyFilter = tableContainer.down('tbody.tbodyFilter', 0);
	
	if (!tbodyFilter) return false;
	
	var texto = txtInput.value;
	// texto vazio: exibir todas as linhas
	if (texto == '') {
		tbodyFilter.immediateDescendants().each(
			function (tr) { tr.show();}
		);
		if(spFilterMsg) spFilterMsg.innerHTML = "";  
		return true;
	}
  
	// confirugando o texto de busca
  if ( opPalavraInteira.checked == true ) {
  	texto = " " + texto + " ";
  }
  var re;
  if ( opCaseSensitive.checked == true ) {
	  re = new RegExp(texto);
  } else {
	  re = new RegExp(texto, "i");
  }

	var contador = 0;
	
	tbodyFilter.immediateDescendants().each(
		function (tr) {
	    if ( re.test(tr.innerHTML.stripScripts().stripTagsWithReplace(" ")) ){
	      tr.show();
	    	contador++;  
	     } else tr.hide();
		}
	);
	
  if(spFilterMsg) {
  	s = (contador>0 ? contador + "&nbsp;linhas&nbsp;encontradas." : "nenhuma&nbsp;ocorrência.");  
  	s += "&nbsp;<a href='javascript: void(null)' onclick='LimparFiltro(this);'>[Limpar]</a>";
  	spFilterMsg.innerHTML = s;  
  }
}

function LimparFiltro(objLink) {
	obj = $(objLink); //evita o bug do IE
	obj = obj.up('div'); // div principal que contem todos os outros elementos
	var txtInput = obj.down('input.tfText');
	txtInput.value = "";
	Filtrar(objLink);
}
