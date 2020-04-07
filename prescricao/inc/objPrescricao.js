Event.observe(window, 'load', function() {
	Prescricao.WindowLoad();
});

var Prescricao = {
	versao: {numero: 2, data: '23/04/2014'},
	/*
	 * IDADE reduz o prazo de prescrição
	 * TENTATIVA reduz a pena.
	 * REINCIDÊNCIA aumenta o prazo de prescrição
	 * 
	 * 
	 * Art. 115 -- benefício da IDADE: a prescrição é reduzida a 1/2
	 * Válido para a PENA APLICADA e para a PENA COMINADA. 
	 * São reduzidos de metade os prazos de prescrição quando o criminoso era, ao tempo do crime, 
	 * menor de 21 (vinte e um) anos, ou, na data da sentença, maior de 70 (setenta) anos.
	 * (Redação dada pela Lei nº 7.209, de 11.7.1984)
	 * 
	 * art 14 -- benefício da TENTATIVA: reduz a pena de 1 a 2 terços. 
	 * Válido para a PENA COMINADA.
	 * Aplicamos a redução máxima para a pena mínima, e a redução mínima para a pena máxima.
	 * parágrafo único - 
	 * Salvo disposição em contrário, pune-se a tentativa com a pena correspondente ao crime consumado, 
	 * diminuída de um a dois terços.
	 * (Alterado pela L-007.209-1984)
	 * 
	 * Art. 110 -- agravante da REINCIDÊNCIA: a prescrição aumenta em 1/3
	 * Válido para a PENA APLICADA.
	 * A prescrição depois de transitar em julgado a sentença condenatória regula-se pela pena aplicada 
	 * e verifica-se nos prazos fixados no artigo anterior, os quais se aumentam de um terço, 
	 * se o condenado é reincidente.
	 * (Redação dada pela Lei nº 7.209, de 11.7.1984)
	 * 
	 */

	diasNoAno: new Number(365.25),
	Hoje: new Date().trunc('t'),
	dataLei12234: new Date(2010, 4, 5, 0, 0, 0, 0), // 5-mai-2010 
	
	
	/**
	 * Calcula o prazo de prescrição para uma pena (em anos)
	 * @param {Number} pena a pena em anos
	 * @returns {Number} a prescrição em anos
	 */
	PrazoPrescricao: function(pena) {
		if (pena.isMulta) {
			return 2;
		}
		
		pena = parseFloat(pena);

		if (pena < 1)
			return (Prescricao.MarcosInterruptivos.AnteriorLei12234 ? 2 : 3);
		if (pena <= 2)
			return  4;
		if (pena <= 4)
			return  8;
		if (pena <= 8)
			return 12;
		if (pena <= 12)
			return 16;

		// senão...
		return 20;

	},
	
	
	MarcoInterruptivo: function (isJulgamento, texto) {
		this.data = false;
		this.isJulgamento = isJulgamento;
		this.texto = texto;
		this.suspensao = new Prescricao.Tempo();
	},
	
	PenasCominadas: [],
	
	/**
	 * 
	 * @type type
	 */
	Util: {
		
		/*
		 * Obtém um objeto data representando o mesmo objeto
		 * do parâmetro.
		 * @param {Date} d o objeto data a ser clonado
		 * @returns {Date} um objeto com a mesma data/hora do anterior
		 */
		CopiarData: function(d) {
			return new Date(d.getTime());
		},
		
		/**
		 * Obtém uma String representando a data, no formato dd/MM/yyyy
		 * caso o parâmetro não estiver preenchido, retorna '-'
		 * @param {type} d a data a ser formatada
		 * @returns {String} a string contendo a data formatada ou '-'
		 */
		FormatarData: function(d) {
			return (d ? d.formatBR() : '-');
		},
		
		/**
		 * Obtém a formatação da pena.
		 * (com até duas casas decimais se tiver parte fracionária)
		 * @param {Number} n a pena em anos decimais a ser formatada
		 * @returns {String} a pena formatada
		 */
		FormatarPena: function(n) {
			n = parseFloat(n);
			var s = n.FormatDecimal(2);
			s = s.replace(',00', '');
			return s;

		},
		
		/**
		 * Calcula a data de prescrição, já considerando a suspensão
		 * @param {type} d da data do marco anterior
		 * @param {type} meses o tempo de presceição, em meses (inteiro)
		 * @param {type} suspensao o tempo de suspensão, em dias, meses e anos
		 */
		CalcularDataPrescricao: function(d, meses, suspensao) {
			var dataPrescricao = Prescricao.Util.CopiarData(d).add('mo', meses);
			dataPrescricao = suspensao.atrasar(dataPrescricao);
			return dataPrescricao.add('d', -1); //última data, imediatamente antes de prescrever
		},
		

		/**
		 * Obtém a quantidade de dias de um determinado mês
		 * @param {Number} ano o ano a que o mês pertence
		 * @param {Number} mes o número do mês dentro do ano preenchido anteriormente
		 * @returns {Number} o número de dias do mês informado
		 */
		DiasNoMes: function(ano, mes) {
			var primeiroDia = new Date(ano, mes, 1);
			var ultimoDiaDoMes = new Date(ano, mes + 1, 0);
			return ultimoDiaDoMes.getDate() - primeiroDia.getDate() + 1;
		},
		
		
		/**
		 * Calcula o tempo decorrido entre duas datas,
		 * pode ser passado um terceiro parâmetro (tempo de suspensão)
		 * a ser descontado do tempo decorrido
		 * @param {Date} dataInicial a data inicial
		 * @param {Date} dataFinal a data final
		 * @param suspensao um objeto representando o tempo de suspensão 
		 * @returns {Prescricao.Util.TempoDecorrido.objTempo}
		 */
		TempoDecorrido: function(dataInicial, dataFinal, suspensao) {
			var dataFimDescontada = suspensao? suspensao.adiantar(dataFinal) : Prescricao.Util.CopiarData(dataFinal);
			var anos = dataFimDescontada.getFullYear() - dataInicial.getFullYear();
			var meses = dataFimDescontada.getMonth() - dataInicial.getMonth();
			var dias = dataFimDescontada.getDate() - dataInicial.getDate();

			//se os dias forem negativos, volta para o mês anterior, descontando o número de dias negativos
			//se descontar 31 dias de um mês de 28, o mês continuará negativo, voltando mais um mês
			if (dias < 0) {
				var diasMesAnterior = Prescricao.Util.DiasNoMes(dataFimDescontada.getFullYear(), dataFimDescontada.getMonth() - 1);
				if (diasMesAnterior > -dias) {
					dias += diasMesAnterior;
				} else {
					//mês anterior com dias menor que o delta, pega o mês retrasado
					diasMesAnterior = Prescricao.Util.DiasNoMes(dataFimDescontada.getFullYear(), dataFimDescontada.getMonth() - 2);
					dias += diasMesAnterior;
				}
				meses--;
			}

			//se os meses forem negativos, volta para o ano anterior, descontando o número de meses negativos
			if (meses < 0) {
				meses += 12;
				anos--;
			}
			return new Prescricao.Tempo(anos, meses, dias);
		},
		
		/**
		 * Acionada no evento onchange do input com a data do Fato.
		 * Se a data informada for anterior à Lei,
		 * colocamos o checkbox realacionado em true,
		 * se não, colocamos em false.
		 */
		Verificarlei12234: function(el) {
			el = $(el);
			if (el.value == '')
				return true;
			$('opANTERIORLEI12234').checked = el.value.toDate() < Prescricao.dataLei12234;
		}
	},
	PenaCominada: {
		
		/**
		 * Cria um objeto Pena Cominada, já contendo sua prescrição 
		 * @param artigo
		 * @param {Number} decPenaMinima a pena mínima em anos (decimal)
		 * @param {Number} decPenaMaxima a pena máxima em anos (decimal)
		 * @param {Boolean} beneficioIdade se a prescrição deve ser calculada
		 *                                 considerando ou não o benefício da 
		 *                                 idade
		 * @param {Boolean} beneficioTentativa se a prescrição deve ser 
		 *                                     calculada considerando ou não o 
		 *                                     benefício de tentativa
		 */
		objPenaCominada: function(artigo, decPenaMinima, decPenaMaxima, beneficioIdade, beneficioTentativa) {
			// decPenaMinima e decPenaMaxima devem ser fornecidos em decimais

			this.penaMinima =
					{
						Pena: parseFloat(decPenaMinima) || 0,
						isMulta: decPenaMinima === 'Multa',
						prescricao_anos: 0,
						Prescricao: {}
					};

			this.penaMaxima =
					{
						Pena: parseFloat(decPenaMaxima) || 0,
						isMulta: decPenaMaxima === 'Multa',
						prescricao_anos: 0,
						Prescricao: {}
					};

			this.artigo = artigo;
			this.beneficioIdade = (beneficioIdade || false);
			this.beneficioTentativa = (beneficioTentativa || false);


			if (this.beneficioTentativa) {
				this.penaMinima.Pena /= 3;		// = 1/3 da pena
				this.penaMaxima.Pena = this.penaMaxima.Pena * 2 / 3; 	// = 2/3 da pena
			}

			Prescricao.PenaCominada.CalcularPrescricao(this);

			Prescricao.PenaCominada.Report(this);
		},
		
		/**
		 * Calcula a prescrição da pena cominada e a anota no próprio objeto
		 * @param {Prescricao.PenaCominada.objPenaCominada} obj a pena cominada para a qual a prescrição será calculada
		 */
		CalcularPrescricao: function(obj) {

			obj.penaMinima.prescricao_anos = Prescricao.PrazoPrescricao(obj.penaMinima.Pena);
			obj.penaMaxima.prescricao_anos = Prescricao.PrazoPrescricao(obj.penaMaxima.Pena);

			if (obj.beneficioIdade) {
				obj.penaMinima.prescricao_anos /= 2;
				obj.penaMaxima.prescricao_anos /= 2;
			}
			Prescricao.PenaCominada.AnotarPrescricao(obj.penaMinima);
			Prescricao.PenaCominada.AnotarPrescricao(obj.penaMaxima);
		},
		
		/**
		 * Cria um objeto pena cominada (já contendo a prescrição)
		 * baseado nos dados preenchidos na tela em "Tipificação Penal",
		 * reaperesenta as penas cominadas na tela
		 * @returns {Boolean} false, se algum erro ocorrer
		 */
		Incluir: function() {
			if (!Prescricao.MarcosInterruptivos.Fato.data) {
				if (!Prescricao.PopularMarcosInterruptivos()) {
					return false;
				}
			}

			var form = $('frmInserirPenaCominada');

			var artigo = form['txtArtigo'].value;
			var decPenaMinima = form['txtPenaMinima'].value;
			var decPenaMaxima = form['txtPenaMaxima'].value;
			var beneficioIdade = form['opBeneficioIdade'].checked;
			var beneficioTentativa = form['opBeneficioTentativa'].checked;

			var pena = new Prescricao.PenaCominada.objPenaCominada(artigo, decPenaMinima, decPenaMaxima, beneficioIdade, beneficioTentativa);
			Prescricao.PenasCominadas.push(pena);
			Prescricao.PenaAplicada.InserirCondenacaoEmTodosReus(pena);
			Prescricao.PenaCominada.PopularTabela();

		},
		
		/**
		 * Remove da memória e da tela, a pena cominada desejada
		 * @param {Number} row_id o índice da pena cominada na lista Prescricao.PenasCominadas
		 */
		Remover: function(row_id) {
			var penaCominada = Prescricao.PenasCominadas[row_id];
			Prescricao.PenasCominadas.splice(row_id, 1);
			Prescricao.PenaAplicada.RemoverCondenacaoParaPenaCominada(penaCominada);
			Prescricao.PenaCominada.PopularTabela();
			Prescricao.PenaAplicada.ExibirReus();

		},
		
		/**
		 * Remove da memória e da tela, todas as penas cominadas
		 */
		RemoverTodos: function() {
			Prescricao.PenasCominadas = [];
			Prescricao.PenaCominada.PopularTabela();
		},
		
		/**
		 * Gera um relatório com as informações exibíveis de uma pena cominada,
		 * de modo que possa ser usado em um template para exibição na tela.
		 * O relatório é armazenado no próprio objeto pena cominada passado como parâmetro
		 * @param {Prescricao.PenaCominada.objPenaCominada} objPena o objeto para o qual o relatório será gerado
		 */
		Report: function(objPena) {
			var objUtil = Prescricao.Util;
			var objPenaMinima = objPena.penaMinima;
			var objPenaMinimaPrescricao = objPenaMinima.Prescricao;
			var objPenaMaxima = objPena.penaMaxima;
			var objPenaMaximaPrescricao = objPenaMaxima.Prescricao;

			objPena.report =
					{
						ARTIGO: objPena.artigo,
						PENA_MIN: objPenaMinima.isMulta? 'Multa' : objUtil.FormatarPena(objPenaMinima.Pena),
						PENA_MAX: objPenaMaxima.isMulta? 'Multa' : objUtil.FormatarPena(objPenaMaxima.Pena),
						PRESCRICAO_MIN: objPenaMinima.prescricao_anos,
						PRESCRICAO_MAX: objPenaMaxima.prescricao_anos,
						IDADE: (objPena.beneficioIdade ? 'X' : '&nbsp;'),
						TENTATIVA: (objPena.beneficioTentativa ? 'X' : '&nbsp;'),
						DENUNCIA_MIN: objUtil.FormatarData(objPenaMinimaPrescricao.Denuncia.data_prescricao),
						cssDENUNCIA_MIN: (objPenaMinimaPrescricao.Denuncia.prescrito ? 'prescrito' : ''),
						JULGAMENTOJF_MIN: objUtil.FormatarData(objPenaMinimaPrescricao.JulgamentoJF.data_prescricao),
						cssJULGAMENTOJF_MIN: (objPenaMinimaPrescricao.JulgamentoJF.prescrito ? 'prescrito' : ''),
						ACORDAOTRF_MIN: objUtil.FormatarData(objPenaMinimaPrescricao.AcordaoTRF.data_prescricao),
						cssACORDAOTRF_MIN: (objPenaMinimaPrescricao.AcordaoTRF.prescrito ? 'prescrito' : ''),
						ACORDAOSTJ_MIN: objUtil.FormatarData(objPenaMinimaPrescricao.AcordaoSTJ.data_prescricao),
						cssACORDAOSTJ_MIN: (objPenaMinimaPrescricao.AcordaoSTJ.prescrito ? 'prescrito' : ''),
						DENUNCIA_MAX: objUtil.FormatarData(objPenaMaximaPrescricao.Denuncia.data_prescricao),
						cssDENUNCIA_MAX: (objPenaMaximaPrescricao.Denuncia.prescrito ? 'prescrito' : ''),
						JULGAMENTOJF_MAX: objUtil.FormatarData(objPenaMaximaPrescricao.JulgamentoJF.data_prescricao),
						cssJULGAMENTOJF_MAX: (objPenaMaximaPrescricao.JulgamentoJF.prescrito ? 'prescrito' : ''),
						ACORDAOTRF_MAX: objUtil.FormatarData(objPenaMaximaPrescricao.AcordaoTRF.data_prescricao),
						cssACORDAOTRF_MAX: (objPenaMaximaPrescricao.AcordaoTRF.prescrito ? 'prescrito' : ''),
						ACORDAOSTJ_MAX: objUtil.FormatarData(objPenaMaximaPrescricao.AcordaoSTJ.data_prescricao),
						cssACORDAOSTJ_MAX: (objPenaMaximaPrescricao.AcordaoSTJ.prescrito ? 'prescrito' : '')
					};
		},
		
		/**
		 * Mostra na tela as penas cominadas, com base no relatório previamente
		 * armazenado em cada item da lista de penas cominadas (Prescricao.PenasCominadas)
		 */
		PopularTabela: function() {

			$$('#tbodyCominada tr').invoke('remove');

			var s = "";
			s = "<tr class='trReportTop'>" +
					"<td colspan='6'>#{ARTIGO}</td>\n" +
					"<td>min</td>" +
					"<td class='#{cssDENUNCIA_MIN}'>#{DENUNCIA_MIN}</td>" +
					"<td class='#{cssJULGAMENTOJF_MIN}'>#{JULGAMENTOJF_MIN}</td>" +
					"<td class='#{cssACORDAOTRF_MIN}'>#{ACORDAOTRF_MIN}</td>" +
					"<td class='#{cssACORDAOSTJ_MIN}'>#{ACORDAOSTJ_MIN}</td>" +
					"<td rowspan='2'>" +
					"<a href='javascript:void(null);' title='Remover este item' onclick='Prescricao.PenaCominada.Remover(\"#{ROW_ID}\");'>X</a></td>" +
					"</tr>\n" +
					"<tr class='trReportBottom'>" +
					"<td>#{PENA_MIN}</td>" +
					"<td>#{PENA_MAX}</td>" +
					"<td>#{PRESCRICAO_MIN}</td>" +
					"<td>#{PRESCRICAO_MAX}</td>" +
					"<td>#{IDADE}</td>" +
					"<td>#{TENTATIVA}</td>" +
					"<td>max</td>" +
					"<td class='#{cssDENUNCIA_MAX}'>#{DENUNCIA_MAX}</td>" +
					"<td class='#{cssJULGAMENTOJF_MAX}'>#{JULGAMENTOJF_MAX}</td>" +
					"<td class='#{cssACORDAOTRF_MAX}'>#{ACORDAOTRF_MAX}</td>" +
					"<td class='#{cssACORDAOSTJ_MAX}'>#{ACORDAOSTJ_MAX}</td>" +
					"</tr>\n";
			var row = new Template(s);
			for (var i = 0, rows = Prescricao.PenasCominadas.length; i < rows; i++) {
				Prescricao.PenasCominadas[i].report.ROW_ID = i;
				$('tbodyCominada').insert(row.evaluate(Prescricao.PenasCominadas[i].report));
			}

		},
		
		/**
		 * Verifica as datas de prescrição da pena cominada para cada marco interruptivo
		 * e as anota no próprio objeto (pena cominada) passado como parâmentro
		 * @param {Prescricao.PenaCominada.objPenaCominada} objPena a pena cominada para
		 *		a qual, as datas de prescição dos marcos serão calculadas	 
		 */		
		AnotarPrescricao: function(objPena) {

			var objMarcos = Prescricao.MarcosInterruptivos;


			objPena.Prescricao =
					{
						Denuncia: {data_prescricao: null, prescrito: false},
						JulgamentoJF: {data_prescricao: null, prescrito: false},
						AcordaoTRF: {data_prescricao: null, prescrito: false},
						AcordaoSTJ: {data_prescricao: null, prescrito: false}

					};

			var objPrescricao = objPena.Prescricao;
			var prescricao_meses = objPena.prescricao_anos * 12;

			var marcoAnterior = Prescricao.Util.CopiarData(objMarcos.Fato.data);
			var marcoPosterior = Prescricao.Util.CopiarData(objMarcos.Fato.data);
			var proximaPrescricao = null;

			objPrescricao.Denuncia.data_prescricao = Prescricao.Util.CalcularDataPrescricao(marcoAnterior, prescricao_meses, objMarcos.Denuncia.suspensao);

			objPrescricao.Denuncia.prescrito = objPrescricao.Denuncia.data_prescricao < Prescricao.hoje;


			if (objMarcos.Denuncia.data) {

				marcoAnterior = Prescricao.Util.CopiarData(objMarcos.Denuncia.data);

				proximaPrescricao =
						(
								(objMarcos.JulgamentoJF.data ? objPrescricao.JulgamentoJF : false)
								|| (objMarcos.AcordaoTRF.data ? objPrescricao.AcordaoTRF : false)
								|| (objMarcos.AcordaoSTJ.data ? objPrescricao.AcordaoSTJ : false)
								);
				proximaPrescricao = (proximaPrescricao || objPrescricao.JulgamentoJF);

				marcoPosterior =
						(
								(objMarcos.JulgamentoJF.data ? objMarcos.JulgamentoJF : false)
								|| (objMarcos.AcordaoTRF.data ? objMarcos.AcordaoTRF : false)
								|| (objMarcos.AcordaoSTJ.data ? objMarcos.AcordaoSTJ : false)
								);
				marcoPosterior = (marcoPosterior || marcoPosterior.JulgamentoJF);


				proximaPrescricao.data_prescricao = Prescricao.Util.CalcularDataPrescricao(marcoAnterior, prescricao_meses, objMarcos.JulgamentoJF.suspensao);

				proximaPrescricao.prescrito = proximaPrescricao.data_prescricao < Prescricao.hoje;

				objPrescricao.Denuncia.prescrito = objPrescricao.Denuncia.data_prescricao < objMarcos.Denuncia.data;


			}

			if (objMarcos.JulgamentoJF.data) {

				marcoAnterior = Prescricao.Util.CopiarData(objMarcos.JulgamentoJF.data);

				objPrescricao.AcordaoTRF.data_prescricao = Prescricao.Util.CalcularDataPrescricao(objMarcos.JulgamentoJF.data, prescricao_meses, objMarcos.AcordaoTRF.suspensao);

				objPrescricao.AcordaoTRF.prescrito = objPrescricao.AcordaoTRF.data_prescricao < Prescricao.hoje;

				objPrescricao.JulgamentoJF.prescrito = objPrescricao.JulgamentoJF.data_prescricao < objMarcos.JulgamentoJF.data;

			}

			if (objMarcos.AcordaoTRF.data) {

				marcoAnterior = Prescricao.Util.CopiarData(objMarcos.AcordaoTRF.data);

				objPrescricao.AcordaoSTJ.data_prescricao = Prescricao.Util.CalcularDataPrescricao(objMarcos.AcordaoTRF.data, prescricao_meses, objMarcos.AcordaoSTJ.suspensao);


				objPrescricao.AcordaoSTJ.prescrito = objPrescricao.AcordaoSTJ.data_prescricao < Prescricao.hoje;

				objPrescricao.AcordaoTRF.prescrito = objPrescricao.AcordaoTRF.data_prescricao < objMarcos.AcordaoTRF.data;
			}

			if (objMarcos.AcordaoSTJ.data) {
				objPrescricao.AcordaoSTJ.prescrito = objPrescricao.AcordaoSTJ.data_prescricao < objMarcos.AcordaoSTJ.data;
			}

		}
	},
	PenaAplicada: {
		/**
		 * Array contendo os dados de cada réu do processo
		 * @type Array
		 */
		reus: [],
		
		/**
		 * Constrói um objeto Reu vazio, sem condenações
		 * @param {String} nome o nome do réu a ser criado
		 * @param {boolean} beneficioIdade se goza ou não do benefício de idade  
		 */
		Reu: function(nome, beneficioIdade) {
			this.nome = nome;
			this.beneficioIdade = beneficioIdade;
			this.condenacoes = [];
		},
		
		/**
		 * Insere e exibe um réu na tela, criando uma condenação
		 * para cada linha de tipificação penal
		 */
		InserirReu: function() {
			var frmMarcos = $('frmMarcosInterruptivos');
			var txtNovoReu = $('txtNovoReu');
			var opReuBeneficioIdade = $('opReuBeneficioIdade');
			var reus = Prescricao.PenaAplicada.reus;
			var reu = new Prescricao.PenaAplicada.Reu(txtNovoReu.value, opReuBeneficioIdade.checked);
			var penasCominadas = Prescricao.PenasCominadas;

			var marcos = Prescricao.MarcosInterruptivos;
			if (!(marcos.JulgamentoJF.data || marcos.AcordaoTRF.data || marcos.AcordaoSTJ.data)) {
				setMsg("A data do julgamento deve ser preenchida", true);
				try {
					frmMarcos['txtDT_JULGAMENTOJF'].focus();
				} catch (e) {
				}
				return false;
			}

			for (var i = 0; i < penasCominadas.length; i++) {
				var penaCominada = penasCominadas[i];
				if (penaCominada.beneficioIdade === reu.beneficioIdade) {
					var condenacao = new Prescricao.PenaAplicada.Condenacao(penasCominadas[i], i);
					reu.condenacoes.push(condenacao);
				}
			}

			if (reu.condenacoes.length === 0) {
				setMsg("A tipificação penal " + (reu.beneficioIdade ? "com" : "sem") +
						" benefício de idade deve ser inserida", true);
				try {
					$('txtArtigo').focus();
				} catch (e) {
				}
				return false;
			}

			reus.push(reu);
			txtNovoReu.value = '';
			opReuBeneficioIdade.checked = false;
			txtNovoReu.focus();
			Prescricao.PenaAplicada.ExibirReu(reu, reus.length - 1);
		},
		
		/**
		 * Cria um objeto representando uma linha de condenação de um réu
		 * @param {Prescricao.PenaCominada.objPena} penaCominada o objeto representando a pena cominada (tipificação)
		 *	para a qual a condenação será criada
		 */
		Condenacao: function(penaCominada) {
			this.artigo = penaCominada.artigo;
			this.penaCominada = penaCominada;
			this.julgamentos = [
				{nome: 'JulgamentoJF', marco: Prescricao.MarcosInterruptivos.JulgamentoJF, sentenca: 'condenatoria'},
				{nome: 'AcordaoTRF', marco: Prescricao.MarcosInterruptivos.AcordaoTRF, sentenca: 'condenatoria'},
				{nome: 'AcordaoSTJ', marco: Prescricao.MarcosInterruptivos.AcordaoSTJ, sentenca: 'condenatoria'}
			];
		},
		
		/**
		 * Cria um objeto condenação baseado no objeto penaCominada, insere em cada
		 * réu e exibe na tela as alterações
		 * @param {Prescricao.PenaCominada.objPena} penaCominada
		 */
		InserirCondenacaoEmTodosReus: function(penaCominada) {
			for (var i = 0; i < Prescricao.PenaAplicada.reus.length; i++) {
				var reu = Prescricao.PenaAplicada.reus[i];
				if (penaCominada.beneficioIdade === reu.beneficioIdade) {
					reu.condenacoes.push(new Prescricao.PenaAplicada.Condenacao(penaCominada));
				}
			}
			Prescricao.PenaAplicada.ExibirReus();
		},
		
		/**
		 * A partir dos índices de réu e condenação, calcula a prescrição
		 * da condenação para cada julgamento e exibe na tela
		 * @param {int} reuIndex o índice do réu a calcular/exibir a prescrição
		 * @param {int} condenacaoIndex
		 * @param {element} um elemento qualquer na linha da condenação a ser processada
		 */
		ExibirPrescricao: function(reuIndex, condenacaoIndex, el) {
			el = $(el);
			var tr = el.up('tr.condenacao');
			var reu = Prescricao.PenaAplicada.reus[reuIndex];
			var condenacao = reu.condenacoes[condenacaoIndex];
			condenacao.reincidente = tr.down('input.reincidente').checked;
			var prescricaoMin = Prescricao.PenaAplicada.CalcularPrescricaoPenaEmAnos(condenacao.penaCominada.penaMinima.Pena, reu.beneficioIdade, condenacao.reincidente);
			var prescricaoMax = Prescricao.PenaAplicada.CalcularPrescricaoPenaEmAnos(condenacao.penaCominada.penaMaxima.Pena, reu.beneficioIdade, condenacao.reincidente);
			for (var i = 0; i < condenacao.julgamentos.length; i++) {
				var julgamento = condenacao.julgamentos[i];
				Prescricao.PenaAplicada.LerPena(julgamento, tr.next('tr.tempoPena'));
				if (julgamento.marco.data) {
					if (julgamento.sentenca === 'absolutoria') {
						julgamento.prescricao = new Prescricao.Tempo();
						if (julgamento.nome !== 'AcordaoSTJ') {
							julgamento.marcosPrescricaoPenaMinima =
									Prescricao.PenaAplicada.ObterMarcosPrescricao(
											julgamento, condenacao, prescricaoMin
											);
							julgamento.marcosPrescricaoPenaMaxima =
									Prescricao.PenaAplicada.ObterMarcosPrescricao(
											julgamento, condenacao, prescricaoMax
											);
						}
					} else {
						if(julgamento.sentenca === 'multa') {
							julgamento.prescricao = new Prescricao.Tempo(2,0,0);
						} else {
							julgamento.prescricao = Prescricao.PenaAplicada.CalcularPrescricao(julgamento.pena, reu.beneficioIdade, condenacao.reincidente);
						}
							
						julgamento.marcosPrescricao = Prescricao.PenaAplicada.ObterMarcosPrescricao(
								julgamento, condenacao, julgamento.prescricao
								);
					}
				}
			}
			Prescricao.PenaAplicada.ExibirReus();
		},
		
		/**
		 * Obtém as informações da prescrição de cada julgamento
		 * referente aos seus marcos interruptivos anteriores e ao próximo julgamento
		 * @param julgamento o julgamento cuja sentença será considerada para o cálculo de prescrição dos marcos
		 * @param condenacao a condenação (para um artigo) a que esse julgamento se refere 
		 * @param tempoPrescricao o tempo de prescrição aplicável a esse julgamento (pode ser da pena cominada (mínima ou máxima) ou da pena aplicada)
		 * @returns {Prescricao.PenaAplicada.ObterMarcosPrescricao.marcosPrescricao|Array}
		 */
		ObterMarcosPrescricao: function(julgamento, condenacao, tempoPrescricao) {
			var marcosPrescricao = [];

			//não julgamentos
			var marcosConsiderados = [
				Prescricao.MarcosInterruptivos.Fato,
				Prescricao.MarcosInterruptivos.Denuncia
			];

			for (var i = 0; i < condenacao.julgamentos.length; i++) {
				var julgamentoACalcular = condenacao.julgamentos[i];
				if (julgamentoACalcular.marco.data && !(julgamentoACalcular.sentenca === 'absolutoria')) {
					marcosConsiderados.push(julgamentoACalcular.marco);
				}
				if (julgamentoACalcular === julgamento) {
					//sempre insere o marco do próximo julgamento, se houver, e pára
					if (i !== condenacao.julgamentos.length - 1) {
						marcosConsiderados.push(condenacao.julgamentos[i + 1].marco);
					}
					break;
				}
			}

			for (var i = 1; i < marcosConsiderados.length; i++) {
				marcosPrescricao.push(new Prescricao.PenaAplicada.MarcoPrescricao(marcosConsiderados[i], marcosConsiderados[i-1], condenacao, tempoPrescricao));
			}
			return marcosPrescricao;
		},
		
		/**
		 * Cria um objeto representando as informações de prescrição de um marco interruptivo (em relação a um julgamento)
		 * @param marcoInterruptivo o marco interruptivo ao qual a informação de prescrição se refere
		 * @param marcoInterruptivoAnterior o marco interruptivo anterior ao marco ao qual a informação de prescrição se refere
		 *			(ele deve ser realmente interruptivo, não pode ser um julgamento absolvendo o réu)  
		 * @param condenacao a condenação (para um artigo) a que esse julgamento se refere 
		 * @param tempoPrescricao o tempo de prescrição da sentença aplicada no julgamento
		 */
		MarcoPrescricao : function (marcoInterruptivo, marcoInterruptivoAnterior, condenacao, tempoPrescricao) {
			var tempoSuspensao = new Prescricao.Tempo();
			//soma as suspensões dos marcos absolutórios imediatamente anteriores
			if (marcoInterruptivo.isJulgamento) {
				for (var j = 0; j < condenacao.julgamentos.length && condenacao.julgamentos[j].marco !== marcoInterruptivo; j++) {
					if (condenacao.julgamentos[j].sentenca === 'absolutoria') {
						tempoSuspensao = tempoSuspensao.mais(condenacao.julgamentos[j].marco.suspensao);
					} else {
						//a suspensão somada é só dos marcos absolutórios imediatamente anteriores
						//se achar uma pena condenatória no meio, zera a contagem
						tempoSuspensao = new Prescricao.Tempo();
					}
				}
			}

			//soma a suspensão do marco atual
			tempoSuspensao = tempoSuspensao.mais(marcoInterruptivo.suspensao);

			var dataPrescricao = 
					tempoPrescricao.mais(tempoSuspensao)
					.atrasar(marcoInterruptivoAnterior.data);
					
			//dia imediatamente anterior
			var dataPrescricao = dataPrescricao.add("d", -1);
			var dataComparacao = marcoInterruptivo.data ? marcoInterruptivo.data : new Date();
			
			this.data = dataPrescricao;
			this.isPrescrito = dataComparacao > dataPrescricao,
			this.marco = marcoInterruptivo;
		},

		/**
		 * Calcula a prescrição de uma pena
		 * @param pena a pena, em anos, meses e dias
		 * @param {boolean} idade se o réu goza ou não do benefício da idade
		 * @param {type} reincidente se o réu é reincidente ou não na tipificação
		 * @returns a prescrição, em anos, meses e dias
		 */
		CalcularPrescricao: function(pena, idade, reincidente) {
			var penaEmAnos = pena.anos + pena.meses / 12 + pena.dias / 365;
			return Prescricao.PenaAplicada.CalcularPrescricaoPenaEmAnos(penaEmAnos, idade, reincidente);
		},
		
		/**
		 * Calcula a prescrição de uma pena
		 * @param penaEmAnos, a pena em anos (decimal)
		 * @param idade se o réu goza ou não do benefício da idade
		 * @param reincidente  reincidente se o réu é reincidente ou não na tipificação
		 * @returns a prescrição, em anos, meses e dias
		 */
		CalcularPrescricaoPenaEmAnos: function(penaEmAnos, idade, reincidente) {
			var tempo = Prescricao.PrazoPrescricao(penaEmAnos);
			var meses = tempo * 12; //passando para meses para evitar erros de arredondamento
			if (idade) {
				meses /= 2;
			}
			if (reincidente) {
				meses += (meses / 3);
			}
			return new Prescricao.Tempo(Math.floor(meses / 12), meses % 12, 0);
		},
		
		/**
		 * Remove uma condenação de um réu e reexibe os réus na tela
		 * @param reuIndex o índice do réu cuja condenação será removida
		 * @param condenacaoIndex o índice da condenação a ser removida
		 */
		Remover: function(reuIndex, condenacaoIndex) {
			var reus = Prescricao.PenaAplicada.reus;
			var reu = reus[reuIndex];
			reu.condenacoes.splice(condenacaoIndex, 1);
			Prescricao.PenaAplicada.ExibirReus();
		},
		
		/**
		 * Remove um réu e reexibe os demais na tela
		 * @param reuIndex o índice do réu a ser removido
		 */
		RemoverReu: function(reuIndex) {
			Prescricao.PenaAplicada.reus.splice(reuIndex, 1);
			Prescricao.PenaAplicada.ExibirReus();
		},
		
		/**
		 * Remove de todos os réus a condenação referente à tipificação 
		 * (representada pela penaCominada passada como parâmetro) 
		 * @param penaCominada
		 */
		RemoverCondenacaoParaPenaCominada: function(penaCominada) {
			var reus = Prescricao.PenaAplicada.reus;
			for (var reuIndex = 0; reuIndex < reus.length; reuIndex++) {
				var reu = reus[reuIndex];
				for (var condenacaoIndex = 0; condenacaoIndex < reu.condenacoes.length; condenacaoIndex++) {
					var condenacao = reu.condenacoes[condenacaoIndex];
					if (condenacao.penaCominada === penaCominada) {
						reu.condenacoes.splice(condenacaoIndex, 1);
						condenacaoIndex--;
					}
				}
			}
		},
		
		/**
		 * Lê a pena preenchida na tela e coloca no objeto julgamento a que se refere 
		 * @param julgamento o julgamento cuja pena será lida
		 * @param {element} el o elemento html onde estão os inputs do julgamento a ser lido 
		 */
		LerPena: function(julgamento, el) {
			var nomeJulgamento = julgamento.nome;
			var inputAnos = el.down('input.' + nomeJulgamento + 'anos');
			if (inputAnos) {
				var inputMeses = el.down('input.' + nomeJulgamento + 'meses');
				var inputDias = el.down('input.' + nomeJulgamento + 'dias');
			}
			var anos = inputAnos ? (inputAnos.value ? parseInt(inputAnos.value) : 0) : 0;
			var meses = inputMeses ? (inputMeses.value ? parseInt(inputMeses.value) : 0) : 0;
			var dias = inputDias ? (inputDias.value ? parseInt(inputDias.value) : 0) : 0;
			
			var pena = new Prescricao.Tempo(anos, meses, dias);
			julgamento.pena = pena;
		},
		
		/**
		 * Exibe na tela a lista de réus (Prescricao.PenaAplicada.reus)
		 */
		ExibirReus: function() {
			var reus = Prescricao.PenaAplicada.reus;
			$('divPenaAplicada').innerHTML = '';
			for (var i = 0; i < reus.length; i++) {
				Prescricao.PenaAplicada.ExibirReu(reus[i], i);
			}
		},
		
		AlterarSentenca: function(reuIndex, condenacaoIndex, julgamentoIndex, el) {
			el = $(el);
			
			var condenacao = Prescricao.PenaAplicada
					.reus[reuIndex]
					.condenacoes[condenacaoIndex];
			
			var julgamento = condenacao
					.julgamentos[julgamentoIndex];

			julgamento.sentenca = el.value;
			julgamento.pena = null;
			Prescricao.PenaAplicada.LimparCalculoPrescricaoDeCondenacao(condenacao);
			Prescricao.PenaAplicada.ExibirReus();
		},
		
		LimparCalculoPrescricaoDeJulgamento: function(julgamento) {
			julgamento.prescricao = null;
		},
		
		LimparCalculoPrescricaoDeCondenacao: function(condenacao) {
			for(var i =0; i<condenacao.julgamentos.length; i++) {
				Prescricao.PenaAplicada.LimparCalculoPrescricaoDeJulgamento(condenacao.julgamentos[i]);
			}
		},
		
		LimparCalculoPrescricaoDeReu: function(reu) {
			for(var i =0; i<reu.condenacoes.length; i++) {
				Prescricao.PenaAplicada.LimparCalculoPrescricaoDeCondenacao(reu.condenacoes[i]);
			}
		},
		
		LimparCalculoPrescricao: function() {
			for(var i =0; i<Prescricao.PenaAplicada.reus.length; i++) {
				Prescricao.PenaAplicada.LimparCalculoPrescricaoDeReu(Prescricao.PenaAplicada.reus[i]);
			}
		},
		
		/**
		 * Exibe na tela o réu passado como parâmetro
		 * @param reu o réu a ser exibido
		 * @param reuIndex o índice do réu na lista de réus (Prescricao.PenaAplicada.reus)
		 */
		ExibirReu: function(reu, reuIndex) {
			var table = "\n\
			<table class='tblForm' id='tblAplicada#{reuIndex}'>\n\
				<thead>\n\
					<tr>\n\
						<td colspan='15'><b>#{nomeReu}</b></td>\n\
						<th rowspan='5' colspan='2' colspan='2'><a href='javascript:void(null);' title='Remover este reu' onclick='Prescricao.PenaAplicada.RemoverReu(#{reuIndex});'>X</a></th>     \n\
					</tr>\n\
					<tr>\n\
						<th colspan='3' rowspan='2'>Condenações</th>\n\
						<th colspan='12'>Julgamentos</th>\n\
					</tr>\n\
					<tr>\n\
						<th colspan='4'>JF</th>\n\
						<th colspan='4'>TRF</th>\n\
						<th colspan='4'>STJ / STF</th>\n\
					</tr>\n\
					<tr>\n\
						<th rowspan='2'>Artigo</th>\n\
						<th rowspan='2'>Benef.<br>idade</th>\n\
						<th rowspan='2'>Reinci<br>dente</th>\n\
						<th colspan='3'>Pena</th>\n\
						<th rowspan='2'>Prescri&ccedil;&atilde;o</th>\n\
						<th colspan='3'>Pena</th>\n\
						<th rowspan='2'>Prescri&ccedil;&atilde;o</th>\n\
						<th colspan='3'>Pena</th>\n\
						<th rowspan='2'>Prescri&ccedil;&atilde;o</th>\n\
					</tr>\n\
					<tr>\n\
						<th>anos</th>\n\
						<th>meses</th>\n\
						<th>dias</th>\n\
						<th>anos</th>\n\
						<th>meses</th>\n\
						<th>dias</th>\n\
						<th>anos</th>\n\
						<th>meses</th>\n\
						<th>dias</th>\n\
					</tr>\n\
				</thead>\n\
				<tbody id='tbodyAplicada'>\n\#{linhasCondenacao}\n\
				</tbody>\n\
				</table>";

			var linhaCondenacao = "\
				<tr class='condenacao'>\n\
					<td class='texto' rowspan='3'>#{artigo}</td>\n\
					<td rowspan='3'>#{beneficioIdade}</td>\n\
					<td rowspan='3'><input type='checkbox' class='reincidente' #{reincidente}></input></td>\n\#{sentencasPrescricao} \n\
					<td rowspan='3'><input type='button' value='Calcular' onclick='Prescricao.PenaAplicada.ExibirPrescricao(#{reuIndex}, #{condenacaoIndex}, this);'></td>\n\
					<td rowspan='3'><a href='javascript:void(null);' title='Remover esta condenação' onclick='Prescricao.PenaAplicada.Remover(#{reuIndex}, #{condenacaoIndex});'>X</a></td>\n\
				</tr>\n\
				<tr class='tempoPena'>#{colunasJulgamentos}</tr>\n\
				<tr>\n<br>#{relatoriosPrescricao}\n\
				</tr>\n";

			var colunaJulgamento = "\n\
					<td><input class='texto input100pc center #{nomeJulgamento}anos' size='1' type='text' value='#{anos}'/></td>\n\
					<td><input class='texto input100pc center #{nomeJulgamento}meses' size='1' type='text' value='#{meses}'/></td>\n\
					<td><input class='texto input100pc center #{nomeJulgamento}dias' size='1' type='text' value='#{dias}'/></td>";


			var colunaJulgamentoIndisponivel = "\n\
					<td> - </td>\n\
					<td> - </td>\n\
					<td> - </td>";

			var relatorioPrescricao = "\
					<td class='texto' colspan='4'>\n#{marcosPrescricao}\n\
					</td>\n";

			var linhasCondenacao = "";
			var sentencaPrescricao = "\
					<td colspan='3'>\n\
						<select onchange='Prescricao.PenaAplicada.AlterarSentenca(#{reuIndex}, #{condenacaoIndex}, #{julgamentoIndex}, this);'>\n\
							<option #{condenatoriaSelected} value='condenatoria'>Condenat&oacute;ria</option>\n\
							<option #{absolutoriaSelected} value='absolutoria'>Absolut&oacute;ria</option>\n\
							<option #{multaSelected} value='multa'>Pena de Multa</option>\n\
						</select>\n\
					</td>\n\
					<td rowspan='2'>#{prescricao}</td>\n";
			
			var sentencaPrescricaoIndisponivel = "\
					<td colspan='3'>\n\
						- \n\
					</td> \n\
					<td rowspan='2'>-</td>\n";
			
			for (var i = 0; i < reu.condenacoes.length; i++) {
				var condenacao = reu.condenacoes[i];
				var colunasJulgamentos = "";
				var relatoriosPrescricao = "";
				var sentencasPrescricao = "";
				for (var j = 0; j < condenacao.julgamentos.length; j++) {
					var julgamento = condenacao.julgamentos[j];
					if (julgamento.marco.data) {
						
						var sentenca = julgamento.sentenca || 'condenatoria';
						
						if(sentenca === 'absolutoria') {
							colunasJulgamentos += colunaJulgamentoIndisponivel;
						} else {
							colunasJulgamentos += new Template(colunaJulgamento).evaluate({
								nomeJulgamento: julgamento.nome,
								anos: julgamento.pena ? (julgamento.pena.anos || 0) : '',
								meses: julgamento.pena ? (julgamento.pena.meses || 0) : '',
								dias: julgamento.pena ? (julgamento.pena.dias || 0) : '',
							});
						}
						relatoriosPrescricao += new Template(relatorioPrescricao).evaluate({
							marcosPrescricao:
									Prescricao.PenaAplicada.GerarRelatoriosMarcosPrescricao(julgamento, condenacao.julgamentos[j + 1])
						});
						
						sentencasPrescricao += new Template(sentencaPrescricao).evaluate({
							prescricao: julgamento.prescricao,
							condenatoriaSelected : sentenca === 'condenatoria' ? 'selected' : '',
							multaSelected : sentenca === 'multa' ? 'selected' : '', 
							absolutoriaSelected : sentenca === 'absolutoria' ? 'selected' : '',
							reuIndex : reuIndex,
							condenacaoIndex : i,
							julgamentoIndex : j
						});
					} else {
						julgamento.pena = null;
						colunasJulgamentos += colunaJulgamentoIndisponivel;
						relatoriosPrescricao += new Template(relatorioPrescricao).evaluate({
							marcosPrescricao: ""
						});
						sentencasPrescricao += sentencaPrescricaoIndisponivel;
					}
				}

				linhasCondenacao += new Template(linhaCondenacao).evaluate({
					artigo: condenacao.artigo,
					beneficioIdade: reu.beneficioIdade ? 'x' : '',
					condenacaoIndex: i,
					reuIndex: reuIndex,
					colunasJulgamentos: colunasJulgamentos,
					relatoriosPrescricao: relatoriosPrescricao,
					sentencasPrescricao : sentencasPrescricao,
					reincidente: condenacao.reincidente ? 'checked' : ''
				});
			}

			$('divPenaAplicada').innerHTML += new Template(table).evaluate({
				linhasCondenacao: linhasCondenacao,
				nomeReu: reu.nome,
				reuIndex: reuIndex
			});
		},
		
		/**
		 * Gera o relatório de marcos de prescrição para um julgamento
		 * @param {type} julgamento
		 * @param {type} proximoJulgamento
		 * @returns {String}
		 */
		GerarRelatoriosMarcosPrescricao: function(julgamento, proximoJulgamento) {
			if (!julgamento.prescricao) {
				return '';
			}

			if (julgamento.sentenca === 'absolutoria') {
				if (julgamento.nome === 'AcordaoSTJ') {
					return 'Absolvido';
				}
				return "\
					Pena mínima:\n<br>" +
						Prescricao.PenaAplicada.GerarRelatorioMarcosPrescricao(
								julgamento.marcosPrescricaoPenaMinima, proximoJulgamento 
								) +
						"\n<br>\n<br>\
					Pena máxima:\n<br>" +
						Prescricao.PenaAplicada.GerarRelatorioMarcosPrescricao(
								julgamento.marcosPrescricaoPenaMaxima, proximoJulgamento
								);
			}

			return Prescricao.PenaAplicada.GerarRelatorioMarcosPrescricao(
					julgamento.marcosPrescricao, proximoJulgamento 
					);
		},
		
		/**
		 * Gera um relatório para os marcos de prescrição
		 * @param marcosPrescricao os marcos de prescrição referentes a sentença do julgamento atual
		 * @param proximoJulgamento o próximo julgamento (para o qual será exibida a data de prescrição)
		 * @returns {String} o relatório desejado
		 */
		GerarRelatorioMarcosPrescricao: function(marcosPrescricao, proximoJulgamento) {
			if (!marcosPrescricao) {
				return '';
			}

			var relatorio = '\
						&nbsp;Marcos prescritos:';
			var possuiMarcoPrescrito = false;
			var marcoPrescricaoProximoJulgamento;
			if (marcosPrescricao && marcosPrescricao.length > 0) {
				for (var i = 0; i < marcosPrescricao.length; i++) {
					var marcoPrescricao = marcosPrescricao[i];
					if (proximoJulgamento && proximoJulgamento.marco === marcoPrescricao.marco) {
						marcoPrescricaoProximoJulgamento = marcoPrescricao;
					} else {
						if (marcoPrescricao.isPrescrito) {
							//não exibe o próximo julgamento nessa lista
							relatorio += "\n<br>\
							&nbsp;&nbsp;- <span class='prescrito'>" + marcoPrescricao.marco.texto + "</span>";
							possuiMarcoPrescrito = true;
						}
					}
				}
				relatorio;
			}
			if (!possuiMarcoPrescrito) {
				relatorio += "\n<br>\
							&nbsp;&nbsp;- Nenhum";
			}

			if (marcoPrescricaoProximoJulgamento) {
				relatorio += "\n<br>\n<br>\
						&nbsp;Prescrição do " + marcoPrescricaoProximoJulgamento.marco.texto + ":";
				relatorio += "\n<br>\
							&nbsp;&nbsp;- <span class=" +
							(marcoPrescricaoProximoJulgamento.isPrescrito ? 'prescrito' : '') + ">" +
							marcoPrescricaoProximoJulgamento.data.formatBR() + "</span>";
			}

			return relatorio;
		}
	},
	
	Suspensao: {
		/**
		 * Os períodos de suspensão do processo
		 * @type Array[Prescricao.Suspensao.Periodo]
		 */
		Periodos: [],

		/**
		 * Um período de suspensão do processo, contendo início e fim
		 * e um método para obter os marcos de prescrição entre os 
		 * quais está contido (delimitadores)
		 * @param {type} inicio o início do período de suspensão
		 * @param {type} fim o fim do período de suspensão
		 */
		Periodo: function(inicio, fim) {
			this.inicio = inicio;
			this.fim = fim;
			this.getMarcosDelimitadores = function() {
				return Prescricao.Suspensao.ObterMarcosDelimitadores(inicio, fim);
			};
		},
		
		/**
		 * Insere o período de suspensão preenchido na tela e o exibe
		 * @returns {Boolean} false, caso haja algum erro na execução da função
		 */
		InserirPeriodo: function() {
			var txtInicio = $('txtInicioSuspensao');
			var txtFim = $('txtFimSuspensao');

			var inicio = txtInicio.value;
			var fim = txtFim.value;

			if (!inicio || !fim) {
				setMsg("Informe as datas de início e fim", true);
				try {
					inicio ? txtFim.focus() : txtInicio.focus();
				} catch (e) {
				}
				return false;
			}

			var dataInicio = inicio.toDate();
			var dataFim = fim.toDate();

			if (dataFim < dataInicio) {
				setMsg("A data de fim deve ser superior à de inicio", true);
				try {
					inicio ? txtFim.focus() : txtInicio.focus();
				} catch (e) {
				}
				;
				return false;
			}

			if (!Prescricao.PopularMarcosInterruptivos()) {
				return false;
			}

			if (!Prescricao.MarcosInterruptivos.Fato.data) {
				setMsg("Informe a data do " + Prescricao.MarcosInterruptivos.Fato.texto, true);
				try {
					$('DT_FATO').focus();
				} catch (e) {
				}
				;
				return false;
			}

			var marcosDelimitadores = Prescricao.Suspensao.ObterMarcosDelimitadores(dataInicio, dataFim);

			if (marcosDelimitadores.erro) {
				setMsg(marcosDelimitadores.erro, true);
				try {
					(marcosDelimitadores.erroDataFim ? txtFim : txtInicio).focus();
				} catch (e) {
				}
				;
				return false;
			}

			var periodoSuspensao =
					new Prescricao.Suspensao.Periodo(txtInicio.value.toDate(), txtFim.value.toDate());

			Prescricao.Suspensao.Periodos.push(periodoSuspensao);
			Prescricao.Suspensao.AtualizarPeriodos();
			Prescricao.PopularMarcosInterruptivos(); //encarregado de também exibir o período inserido
			txtInicio.value = '';
			txtFim.value = '';
			try {
				txtInicio.focus();
			} catch (e) {
			}
			;
		},
		
		/*
		 * Obtém os marcos interruptivos dentro dos quais 
		 * as datas de início e fim estão contidas
		 * @param dataInicio
		 * @param dataFim
		 * @returns os marcos que delimitam o período, em caso de sucesso, 
		 * caso contrário, as informações de erro
		 */
		ObterMarcosDelimitadores: function(dataInicio, dataFim) {
			var objMarcos = Prescricao.MarcosInterruptivos;
			var marcos = [
				objMarcos.Fato,
				objMarcos.Denuncia,
				objMarcos.JulgamentoJF,
				objMarcos.AcordaoTRF,
				objMarcos.AcordaoSTJ
			];

			var proximoIndex = null;
			var anteriorIndex = null;
			for (var i = 0; i < marcos.length; i++) {
				var marco = marcos[i];
				var proximoMarco = proximoIndex ? marcos[proximoIndex] : null;
				var marcoAnterior = anteriorIndex ? marcos[anteriorIndex] : null;

				//marco possui data preenchida
				if (marco.data) {
					//a data do proximo marco deve ser posterior à do parâmetro, porém anterior à última capturada 
					if (marco.data >= dataInicio && (!proximoMarco || marco.data <= proximoMarco.data)) {
						proximoIndex = i;
					}

					//a data do proximo marco deve ser anterior à do parâmetro, porém posterior à última capturada 
					if (marco.data <= dataInicio && (!marcoAnterior || marco.data >= marcoAnterior.data)) {
						anteriorIndex = i;
					}
				}
			}

			if (anteriorIndex !== null && !proximoIndex && anteriorIndex !== objMarcos.length - 1) {
				proximoIndex = anteriorIndex + 1;
			}
			var marcosDelimitadores = {anterior: marcos[anteriorIndex], proximo: marcos[proximoIndex]};

			if (!marcosDelimitadores.anterior) {
				return {erro: "O início desse período de suspensão deve ser posterior ao " + Prescricao.MarcosInterruptivos.Fato.texto};
			}

			if (marcosDelimitadores.anterior.data && dataInicio <= marcosDelimitadores.anterior.data) {
				return {erroDataFim: true, erro: "O início desse período de suspensão deve ser posterior ao marco interruptivo de " + marcosDelimitadores.anterior.texto};
			}

			if (!marcosDelimitadores.proximo) {
				return {erroDataFim: true, erro: "O início desse período de suspensão deve ser anterior ao " + Prescricao.MarcosInterruptivos.AcordaoSTJ.texto};
			}

			if (marcosDelimitadores.proximo.data && dataFim > marcosDelimitadores.proximo.data) {
				return {erroDataFim: true, erro: "O fim desse período de suspensão não pode ser posterior ao marco interruptivo de " + marcosDelimitadores.proximo.texto};
			}

			return marcosDelimitadores;
		},
		
		/**
		 * Atualiza a contagem de suspensão dos marcos interruptivos de acordo 
		 * com os períodos de suspensão inseridos, eventualmente removendo-os
		 * caso estejam inconsistentes
		 */
		AtualizarPeriodos: function() {
			var objMarcos = Prescricao.MarcosInterruptivos;
			objMarcos.Denuncia.suspensao = new Prescricao.Tempo();
			objMarcos.JulgamentoJF.suspensao = new Prescricao.Tempo();
			objMarcos.AcordaoTRF.suspensao = new Prescricao.Tempo();
			objMarcos.AcordaoSTJ.suspensao = new Prescricao.Tempo();

			for (var i = 0; i < Prescricao.Suspensao.Periodos.length; i++) {
				var periodo = Prescricao.Suspensao.Periodos[i];
				var marcosDelimitadores = periodo.getMarcosDelimitadores();
				if (marcosDelimitadores.erro) {
					Prescricao.Suspensao.Periodos.splice(i, 1);
					i--;
				} else {
					var tempo = Prescricao.Util.TempoDecorrido(periodo.inicio, periodo.fim);
					periodo.tempo = tempo;
					var proximoMarco = marcosDelimitadores.proximo;
					proximoMarco.suspensao = proximoMarco.suspensao.mais(tempo);
				}
			}
		},
		
		/**
		 * Exibe os períodos de suspensão inseridos, bem como o tempo total
		 * de suspensão de cada marco (exibido na tabela de marcos interruptivos)
		 */
		ExibirPeriodos: function() {
			$$('#tbodyPeriodosSuspensao tr').invoke('remove');
			var htmlPeriodo = "<tr><td>#{inicio}</td><td>#{fim}</td><td>#{duracao}</td><td>#{proximoMarco}</td><td><a href='javascript:void(null);' title='Remover este item' onclick='Prescricao.Suspensao.RemoverPeriodo(#{index});'>X</a></td></tr>";
			var htmlPeriodos = '';

			var objMarcos = Prescricao.MarcosInterruptivos;

			for (var i = 0; i < Prescricao.Suspensao.Periodos.length; i++) {
				var periodo = Prescricao.Suspensao.Periodos[i];
				var proximoMarco = periodo.getMarcosDelimitadores().proximo;
				htmlPeriodos += new Template(htmlPeriodo).evaluate({
					inicio: periodo.inicio.formatBR(),
					fim: periodo.fim.formatBR(),
					proximoMarco: proximoMarco.texto,
					duracao: periodo.tempo,
					index: i
				});
			}
			$('SUSPENCAO_DENUNCIA').innerHTML = objMarcos.Denuncia.suspensao || '-';
			$('SUSPENCAO_JULGAMENTOJF').innerHTML = objMarcos.JulgamentoJF.suspensao || '-';
			$('SUSPENCAO_ACORDAOTRF').innerHTML = objMarcos.AcordaoTRF.suspensao || '-';
			$('SUSPENCAO_ACORDAOSTJ').innerHTML = objMarcos.AcordaoSTJ.suspensao || '-';

			$('tbodyPeriodosSuspensao').insert(htmlPeriodos);
		},
		
		/**
		 * Remove o período de suspensão com o índice passado da lista (Prescricao.Suspensao.Periodos)
		 * @param {int} index o índice da lista (Prescricao.Suspensao.Periodos)
		 */
		RemoverPeriodo: function(index) {
			Prescricao.Suspensao.Periodos.splice(index, 1);
			Prescricao.Suspensao.AtualizarPeriodos();
			Prescricao.PopularMarcosInterruptivos(); //encarregado de também exibir o período removido
		},
		
		/**
		 * Remove todos os períodos de suspensão da lista (Prescricao.Suspensao.Periodos)
		 */
		RemoverTodos: function() {
			Prescricao.Suspensao.Periodos = [];
			Prescricao.Suspensao.AtualizarPeriodos();
			Prescricao.PopularMarcosInterruptivos(); //encarregado de também exibir os períodos removidos
		}
	},
	
	/**
	 * Popula os marcos interruptivos com os valores preenchidos na tela
	 * e atualiza e exibe os dados que dependem dos mesmos, tais como
	 * períodos de suspensão e prescrições das penas cominadas. Também
	 * acrescenta/exclui julgamentos para o preenchimento da pena aplicada,
	 * porém não recalcula as prescrições em caso de alterações de datas
	 * (é necessário clicar em calcular)
	 */
	PopularMarcosInterruptivos: function() {
		var frmMarcos = $('frmMarcosInterruptivos');
		var objMarcos = this.MarcosInterruptivos;

		objMarcos.Fato.data = false;
		objMarcos.Denuncia.data = false;
		objMarcos.JulgamentoJF.data = false;
		objMarcos.AcordaoTRF.data = false;
		objMarcos.AcordaoSTJ.data = false;

		$$('.spanCominadaDatas').each(function(el) {
			el.innerHTML = '';
		});

		$$('.spanDecorrido').each(function(el) {
			el.innerHTML = '';
		});

		var tempoDecorrido = {};
		if (frmMarcos['txtDT_FATO'].value) {
			objMarcos.Fato.data = frmMarcos['txtDT_FATO'].value.toDate();
		} else {
			setMsg("Informe a data do fato", true);
			try {
				frmMarcos['txtDT_FATO'].focus();
			} catch (e) {
			}
			return false;
		}
		if (frmMarcos['txtDT_DENUNCIA'].value) {
			var dataDenuncia = frmMarcos['txtDT_DENUNCIA'].value.toDate();
			if (dataDenuncia <= objMarcos.Fato.data) {
				setMsg("A data da denúncia deve ser superior à data do fato", true);
				try {
					frmMarcos['txtDT_DENUNCIA'].focus();
				} catch (e) {
				}
				return false;
			}
			objMarcos.Denuncia.data = dataDenuncia;
			tempoDecorrido = Prescricao.Util.TempoDecorrido(objMarcos.Fato.data, objMarcos.Denuncia.data, objMarcos.Denuncia.suspensao);
			var textoTempoDecorrido = tempoDecorrido;
			$('spanCominadaDenuncia').innerHTML = frmMarcos['txtDT_DENUNCIA'].value + '<br>' + textoTempoDecorrido;
			$('DECORRIDO_DENUNCIA').innerHTML = textoTempoDecorrido;
		}
		if (frmMarcos['txtDT_JULGAMENTOJF'].value) {
			if (!objMarcos.Denuncia.data) {
				setMsg("Informe a data da denúncia", true);
				try {
					frmMarcos['txtDT_DENUNCIA'].focus();
				} catch (e) {
				}
				return false;
			}
			var dataJulgamentoJF = frmMarcos['txtDT_JULGAMENTOJF'].value.toDate();
			if (dataJulgamentoJF <= objMarcos.Denuncia.data) {
				setMsg("A data do julgamento na Justiça Federal deve ser superior à anterior", true);
				try {
					frmMarcos['txtDT_JULGAMENTOJF'].focus();
				} catch (e) {
				}
				return false;
			}
			objMarcos.JulgamentoJF.data = dataJulgamentoJF;
			tempoDecorrido = Prescricao.Util.TempoDecorrido(objMarcos.Denuncia.data, objMarcos.JulgamentoJF.data, objMarcos.JulgamentoJF.suspensao);
			var textoTempoDecorrido = tempoDecorrido.toString();
			$('spanCominadaJulgamentoJF').innerHTML = frmMarcos['txtDT_JULGAMENTOJF'].value + '<br>' + textoTempoDecorrido;
			$('DECORRIDO_JULGAMENTOJF').innerHTML = textoTempoDecorrido;
		}
		if (frmMarcos['txtDT_ACORDAOTRF'].value) {
			if (!objMarcos.Denuncia.data) {
				setMsg("Informe a data da denúncia", true);
				try {
					frmMarcos['txtDT_DENUNCIA'].focus();
				} catch (e) {
				}
				return false;
			}
			var dataAcordaoTRF = frmMarcos['txtDT_ACORDAOTRF'].value.toDate();
			if (dataAcordaoTRF <= (objMarcos.JulgamentoJF.data || objMarcos.Denuncia.data)) {
				setMsg("A data do Julgamento no TRF deve ser superior à anterior", true);
				try {
					frmMarcos['txtDT_ACORDAOTRF'].focus();
				} catch (e) {
				}
				return false;
			}
			objMarcos.AcordaoTRF.data = dataAcordaoTRF;
			tempoDecorrido = Prescricao.Util.TempoDecorrido((objMarcos.JulgamentoJF.data || objMarcos.Denuncia.data), objMarcos.AcordaoTRF.data, objMarcos.AcordaoTRF.suspensao);
			var textoTempoDecorrido = tempoDecorrido.toString();
			$('spanCominadaAcordaoTRF').innerHTML = frmMarcos['txtDT_ACORDAOTRF'].value + '<br>' + textoTempoDecorrido;
			$('DECORRIDO_ACORDAOTRF').innerHTML = textoTempoDecorrido;
		}
		if (frmMarcos['txtDT_ACORDAOSTJ'].value) {
			if (!objMarcos.Denuncia.data) {
				setMsg("Informe a data da denúncia", true);
				try {
					frmMarcos['txtDT_DENUNCIA'].focus();
				} catch (e) {
				}
				return false;
			}
			var dataAcordaoSTJ = frmMarcos['txtDT_ACORDAOSTJ'].value.toDate();
			if (dataAcordaoSTJ <= (objMarcos.AcordaoTRF.data || objMarcos.JulgamentoJF.data || objMarcos.Denuncia.data)) {
				setMsg("A data do Julgamento no STJ / STF deve ser superior à anterior", true);
				try {
					frmMarcos['txtDT_ACORDAOSTJ'].focus();
				} catch (e) {
				}
				return false;
			}
			objMarcos.AcordaoSTJ.data = dataAcordaoSTJ;
			tempoDecorrido = Prescricao.Util.TempoDecorrido((objMarcos.AcordaoTRF.data || objMarcos.JulgamentoJF.data || objMarcos.Denuncia.data), objMarcos.AcordaoSTJ.data, objMarcos.AcordaoSTJ.suspensao);
			var textoTempoDecorrido = tempoDecorrido.toString();
			$('spanCominadaAcordaoSTJ').innerHTML = frmMarcos['txtDT_ACORDAOSTJ'].value + '<br>' + textoTempoDecorrido;
			$('DECORRIDO_ACORDAOSTJ').innerHTML = textoTempoDecorrido;
		}

		objMarcos.AnteriorLei12234 = frmMarcos['opANTERIORLEI12234'].checked;
		Prescricao.Suspensao.AtualizarPeriodos(); // "de novo" precisa atualizar nesse ponto porque os marcos mudaram
		Prescricao.Suspensao.ExibirPeriodos();
		if (Prescricao.PenasCominadas.length) {
			// refaz o cálculo da prescrição em cada item
			var objPenas = Prescricao.PenasCominadas;
			for (var i = 0, rows = objPenas.length; i < rows; i++) {
				Prescricao.PenaCominada.CalcularPrescricao(objPenas[i]);
				Prescricao.PenaCominada.AnotarPrescricao(objPenas[i].penaMinima);
				Prescricao.PenaCominada.AnotarPrescricao(objPenas[i].penaMaxima);
				Prescricao.PenaCominada.Report(objPenas[i]);
			}

			Prescricao.PenaCominada.PopularTabela();
			if (Prescricao.PenaAplicada.reus.length) {
				Prescricao.PenaAplicada.LimparCalculoPrescricao();
				Prescricao.PenaAplicada.ExibirReus();
			}
		}

		return true;
	},
	Validar: {
		/*
		 * Valida se um campo data é válido, e o formata da maneira
		 * apropriada caso seja válido ou o limpa e mostra uma mensagem
		 * caso seja inválido
		 * @param {String} obj o campo de data a ser validado
		 * @param {Boolean} displayAlert true para que a mensagem seja exibida também em um alert
		 * @param returnIfNull valor de retorno caso o campo esteja vazio
		 * @returns {Boolean|returnIfNull} true se a data for válida, 
		 *       false se for inválida, returnIfNull se estiver em branco
		 */
		Data: function(obj, displayAlert, returnIfNull) {
			displayAlert = (displayAlert || true);
			returnIfNull = (returnIfNull || false);
			obj.value = obj.value.superTrim();
			if (obj.value == '')
				return returnIfNull;
			var d = obj.value.toDate();
			if (d) {
				obj.value = d.formatBR();
				clearMsg();
				return true;
			}
			// else {
			setMsg('Digite uma data válida!', displayAlert);
			obj.value = '';
			return false;

		}
	},
	
	/**
	 * Exibe os dados do artigo nos campos da tela referentes à
	 *  tipificação penal com os dados dos parâmetros
	 * @param ARTIGO
	 * @param DESCRICAO
	 * @param PENA_MIN
	 * @param PENA_MAX
	 * @param PRESC_MIN
	 * @param PRESC_MAX
	 */
	SelecionarArtigo: function(ARTIGO, DESCRICAO, PENA_MIN, PENA_MAX, PRESC_MIN, PRESC_MAX) {
		if(parseFloat(PRESC_MIN) === 2 && !Prescricao.MarcosInterruptivos.AnteriorLei12234 && PENA_MIN !== 'Multa') {
			PRESC_MIN = 3;
		}
		if(parseFloat(PRESC_MAX) === 2 && !Prescricao.MarcosInterruptivos.AnteriorLei12234 && PENA_MAX !== 'Multa') {
			PRESC_MAX = 3;
		}
		$('txtArtigo').value = ARTIGO;
		$('tdArtigoDescricao').innerHTML = DESCRICAO;
		$('txtPenaMinima').value = PENA_MIN;
		$('txtPenaMaxima').value = PENA_MAX;
		$('txtPrescricaoMinima').value = PRESC_MIN;
		$('txtPrescricaoMaxima').value = PRESC_MAX;
		try {
			$('cmdCalcular').focus();
		} catch (e) {
		}
	},
	
	/*
	 * Configura os eventos nos inputs
	 */
	WindowLoad: function() {
		$$('input[type="text"]', 'textarea').each(function(obj) {

			obj.observe('focus', function() {
				this.toggleClassName('inputFormActive');
			});
			obj.observe('blur', function() {
				this.value = this.value.superTrim();

				// tratando o máximo de caracteres em textarea
				// pois o IE ignora o atributo
				if ($(this).hasAttribute('maxlength')) {
					var maxLength = $(this).getAttribute('maxlength');
					if (this.value.length > maxLength) {
						this.value = this.value.substr(0, maxLength - 1);
					}
				}

				if (this.hasClassName('alluppercase')) {
					this.value = this.value.toUpperCase();
				}
				this.toggleClassName('inputFormActive');
			});
		});

		$$('select').each(function(obj) {
			obj.addClassName('texto');
			obj.observe('focus', function() {
				this.toggleClassName('inputFormActive');
			});
			obj.observe('blur', function() {
				this.toggleClassName('inputFormActive');
			});
		});

		$$('td.tdTexto').each(function(el) {
			el.writeAttribute("defaultValue", el.innerHTML);
		});

		$$('.datatypeDate').each(function(obj) {
			obj.observe('blur', function() {
				Prescricao.Validar.Data(this);
			});
		});

		// colocando a classe correta para os inputs do tipo 'button', 'reset' ou
		// 'submit'
		$$('input[type="button"]', 'input[type="submit"]', 'input[type="reset"]')
				.each(function(obj) {
					obj.addClassName('botao');
				});


		$$('tr.trLinhaArtigo').each(
				function(el) {
					el.observe('mouseover', function() {
						$(this).addClassName("trSelected");
					});
					el.observe('mouseout', function() {
						$(this).removeClassName("trSelected");
					});
					el.observe('click', function() {
						var tr = $(this);
						var artigo = tr.down('td', 0).innerHTML;
						var descricao = tr.down('td', 1).innerHTML;
						var penaMin = tr.down('td', 2).innerHTML;
						var penaMax = tr.down('td', 3).innerHTML;
						var prescMin = tr.down('td', 4).innerHTML;
						var prescMax = tr.down('td', 5).innerHTML;
						Prescricao.SelecionarArtigo(artigo, descricao, penaMin, penaMax, prescMin, prescMax);
					});
				}
		);

		$('txtPenaMinima').observe('change', function() {
			this.value = this.value.replace(',', '.');
			if ( this.value ) {
				$('txtPrescricaoMinima').value = Prescricao.PrazoPrescricao(this.value);
			} else {
				$('txtPrescricaoMinima').value = "";
			}
		});

		$('txtPenaMaxima').observe('change', function() {
			this.value = this.value.replace(',', '.'); 
			if ( this.value ) {
				$('txtPrescricaoMaxima').value = Prescricao.PrazoPrescricao(this.value);
			} else {
				$('txtPrescricaoMaxima').value = "";
			}
		});
	},
	Inspect: function() {
		alert('oi');
	}
};

Prescricao.Tempo = function (anos, meses, dias) {
	this.anos = anos || 0;
	this.meses = meses || 0;
	this.dias = dias || 0;

	this.toString = function () {
		var arr = [];
		if (this.anos > 0) {
			arr.push(this.anos + (this.anos > 1 ? ' anos' : ' ano'));
		}
		if (this.meses > 0) {
			arr.push(this.meses + (this.meses > 1 ? ' meses' : ' mês'));
		}
		if (this.dias > 0) {
			arr.push(this.dias + (this.dias > 1 ? ' dias' : ' dia'));
		}

		return arr.join('; ');
	};

	this.mais = function(tempo2) {
		if (!tempo2) {
			return new Prescricao.Tempo(this.anos, this.meses, this.dias);
		}
		var anos = this.anos + (tempo2.anos || 0);
		var meses = this.meses + (tempo2.meses || 0);
		var dias = this.dias + (tempo2.dias || 0);

		return new Prescricao.Tempo (anos, meses, dias);
	};

	this.menos = function(tempo2) {
		if (!tempo2) {
			return new Prescricao.Tempo(this.anos, this.meses, this.dias);
		}
		var anos = this.anos - (tempo2.anos || 0);
		var meses = this.meses - (tempo2.meses || 0);
		var dias = this.dias - (tempo2.dias || 0);

		return new Prescricao.Tempo (anos, meses, dias);
	};
	
	this.atrasar = function (data) {
		var novaData = new Date(data.getTime());
		novaData = novaData.add('y', this.anos);
		novaData = novaData.add('mo', this.meses);
		novaData = novaData.add('d', this.dias);
		return novaData;
	};
	
	this.adiantar = function (tempo) {
		var novaData = new Date(tempo.getTime());
		novaData = novaData.add('y', -this.anos);
		novaData = novaData.add('mo', -this.meses);
		novaData = novaData.add('d', -this.dias);
		return novaData;
	};
};

/**
 * Marcos que interrompem a prescrição do processo penal
 */
Prescricao.MarcosInterruptivos = {
	Fato: new Prescricao.MarcoInterruptivo(false, "Fato"),
	Denuncia: new Prescricao.MarcoInterruptivo(false, "Denúncia"),
	JulgamentoJF: new Prescricao.MarcoInterruptivo(true, "Julgamento JF"),
	AcordaoTRF: new Prescricao.MarcoInterruptivo(true, "Julgamento TRF"),
	AcordaoSTJ: new Prescricao.MarcoInterruptivo(true, "Julgamento STJ/STF"),
	AnteriorLei12234: false
};