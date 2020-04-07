String.prototype.stripTagsWithReplace = function(replace) {
	return this.replace(/<\/?[^>]+>/gi, (replace || ''));
};

String.prototype.html_nz = function(vValorSeNulo) {
	vValorSeNulo = (vValorSeNulo||"&nbsp;");
	return ((this||"")=="" ? vValorSeNulo : this);
};

String.prototype.soAlgarismos = function() {
	return this.replace(/\D/g,'');// qualquer coisa diferente de dígito (0 a 9)
};

String.prototype.superTrim = function() {
	var s=this.replace(/^\s+|\s+$/g,'');// um espaço ou mais no início ou no final da linha: removemos.
	return s.replace(/\s{2,}/g,' ');// dois ou mais espaços juntos: substituimos por um único espaço.
};

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,'');// um espaço ou mais no início ou no final da linha: removemos.
};

String.prototype.emailValido = function() {
	return ( /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/.test( this ) );
};

String.prototype.validarData = function() {
	var d = new Date().parseBR(this);
	if (!d) {
		return "";
	}
	return d.formatBR();
};

String.prototype.validarDataHora = function() {
	var d = new Date().parseDateTimeBR(this);
	if (!d) {
		return "";
	}
	return d.formatDateTimeBR();
};

String.prototype.toDate = function() {
	return new Date().parseBR(this);
};

String.prototype.toDateTime = function() {
	return new Date().parseDateTimeBR(this);
};

String.prototype.formatNumber = function(decimais) {
	var str = this.soAlgarismos();
	if ( (decimais || 0 ) == 0 ) {
		//separador de milhar sem vírgula
		var re = new RegExp( /(\d+)(\d\d\d)/);
		while ( re.test( str ) ) str = str.replace( re, '$1.$2' );
		return str;
	};

	decimais = parseInt( decimais, 10 );
	++decimais;
	var re = new RegExp( "(\\d{" + decimais + "})" );
	while ( !re.test( str ) ) str = '0' + str;
	--decimais;
	re = new RegExp( "(\\d+)(\\d{" + decimais + "}$)" );
	str = str.replace( re, '$1,$2');
	
	// separador de milhar com vírgula
	re = new RegExp(/(\d+)((\d\d\d)(,|\.)\d*)/);
	while ( re.test( str ) ) str = str.replace( re, '$1.$2' );
	
	return str;
};

Date.prototype.add = function (sInterval, iNum){
	/*
	 * Origem: http://www.codingforums.com/showthread.php?t=3955
	 */
	var dTemp = this;
	if (!sInterval || iNum == 0) return dTemp;
	switch (sInterval.toLowerCase()){
		case "ms":
			dTemp.setMilliseconds(dTemp.getMilliseconds() + iNum);
			break;
		case "s":
			dTemp.setSeconds(dTemp.getSeconds() + iNum);
			break;
		case "mi":
			dTemp.setMinutes(dTemp.getMinutes() + iNum);
			break;
		case "h":
			dTemp.setHours(dTemp.getHours() + iNum);
			break;
		case "d":
			dTemp.setDate(dTemp.getDate() + iNum);
			break;
		case "mo":
			dTemp.setMonth(dTemp.getMonth() + iNum);
			break;
		case "y":
			dTemp.setFullYear(dTemp.getFullYear() + iNum);
			break;
	}
	return dTemp;
};

Date.prototype.trunc = function (sInterval, first){
	var d = this;
	if (!sInterval) return d;
	
	switch (sInterval.toLowerCase()){
		case "w": // semana
			if (first) {
				d.add('d', -d.getDay());
			} else {
				d.add('d', (6 - d.getDay()));
			}
			break;
		case "m": // mes
			if (first) {
				d.add('d', -d.getDate() + 1);
			} else {
				d.add('d', -d.getDate() + 1);
				d.add('mo', 1);
				d.add('d', -1);
			}
			break;
		case "y": // ano
			if (first) {
				d.trunc('m', true);
				d.add('mo', -d.getMonth() );
			} else {
				d.add('mo', 11 - d.getMonth());
				d.trunc('m', false);
			}
			break;
		case "t": // time
			d.setHours(0, 0, 0, 0);
			break;
	}
	return d;
};



Date.prototype.formatBR = function(delimitador) {
	delimitador = (delimitador || "/");
	var d = this;
	var s = new Array( d.getDate(), d.getMonth() + 1, d.getFullYear() );
	if (s[0].toString().length < 2 ) s[0] = '0' + s[0];
	if (s[1].toString().length < 2 ) s[1] = '0' + s[1];
	while (s[2].toString().length < 4 ) s[2] = '0' + s[2];
	return s.join(delimitador);
};

Date.prototype.formatDateTimeBR = function(delimitadorHora, delimitadorTempo) {
	delimitadorHora = (delimitadorHora || "/");
	delimitadorTempo = ( delimitadorTempo || ":" );
	var d = this;
	var s = new Array( d.getDate(), d.getMonth() + 1, d.getFullYear(), d.getHours(), d.getMinutes(), d.getSeconds() );
	if (s[0].toString().length < 2 ) s[0] = '0' + s[0];
	if (s[1].toString().length < 2 ) s[1] = '0' + s[1];
	while (s[2].toString().length < 4 ) s[2] = '0' + s[2];
	if (s[3].toString().length < 2 ) s[3] = '0' + s[3];
	if (s[4].toString().length < 2 ) s[4] = '0' + s[4];
	if (s[5].toString().length < 2 ) s[5] = '0' + s[5];
	return s[0] + delimitadorHora + s[1] + delimitadorHora + s[2]
	 		+ ' ' 
	 		+ s[3] + delimitadorTempo + s[4] + delimitadorTempo + s[5];
};

Date.prototype.parseBR = function( s ) {
  var re = /^((0?[1-9]|[12][0-9]|3[01])\D+(0?[1-9]|1[012])(\D+(\d){2,4})?|\d{4}|\d{6}|\d{8})$/;
  
  if ( !re.test( s ) || s=='' ) { return null; };
  
  re = /\D/;											// qualquer coisa que não seja um algarismo
  if ( !re.test(s) ) {									// não colocou delimitador, apenas formatamos
	  re = /(\d\d)(\d\d)(\d\d)?(\d\d)?/;				// isto formata a data com barras !!!
	  s = s.replace( re, "$" + "1/$" + "2/$" + "3$4" ); // evitando o bug do Joomla "$1/$2/$3$4"
  } else {												// colocou delimitadores, substituímos por '/'		
    re = /[^\d]+/g;										// qualquer coisa que não seja um algarismo, uma ou mais vezes
    s = s.replace(re,'/');								// substituímos por uma barra
  };
  
  s = s.split( '/' );
  s[2] = ( ( s[2] == null || s[2] == '' ) ? this.getFullYear() : s[2] );
  
  if ( s[2] < 100 ) {
	  s[2] = Number( s[2] );
	  s[2] += ( s[2] < 30 ? 2000 : 1900 );
  }
  this.setFullYear( s[2], s[1] - 1, s[0] );
  this.trunc('t');
  return this;
};

Date.prototype.parseDateTimeBR = function( s ) {
  var re = /^((0?[1-9]|[12][0-9]|3[01])\D+(0?[1-9]|1[012])(\D+(\d\d\d\d))?|\d{8}|\d{6}|\d{4})(\D+(([01]\d|2[0-3])(\D*[0-5]\d){1,2})){0,1}$/;
  if ( !re.test( s ) || s=='' ){ return null; };

  var d = s.replace(re, '$1').toDate();
  d.setHours( 0, 0, 0 );
  var strHora = s.replace(re, '$6');
  strHora = strHora.soAlgarismos();
  if (strHora != "") {
	  var arrHora = (/(\d\d)(\d\d)(\d\d){0,1}/).exec(strHora);
	  d.setHours(parseInt(arrHora[1]), parseInt(arrHora[2]), parseInt(arrHora[3] || 0 ) );
  }
  return d;
};

Date.prototype.formatBRExtended = function(format) {

/*
	%d Displays the day as a number without a leading zero (for example, 1).
	%dd Displays the day as a number with a leading zero (for example, 01).
	%ddd Displays the day as an abbreviation (for example, Sun).
	%dddd Displays the day as a full name (for example, Sunday).
	
	%M Displays the month as a number without a leading zero 
	(for example, January is represented as 1).
	%MM Displays the month as a number with a leading zero (for example, 01/12/01).
	%MMM Displays the month as an abbreviation (for example, Jan).
	%MMMM Displays the month as a full month name (for example, January).
	
	%yy Displays the year in two-digit numeric format with a leading zero, if applicable.
	%yyyy Displays the year in four-digit numeric format.
	
	%H Displays the hour as a number without leading zeros using the 24-hour clock
	(for example, 1:15:15).
	%HH Displays the hour as a number with leading zeros using the 24-hour clock
	(for example, 01:15:15).
	
	%m Displays the minute as a number without leading zeros
	(for example, 12:1:15).
	%mm Displays the minute as a number with leading zeros
	(for example, 12:01:15).
	
	%s Displays the second as a number without leading zeros
	(for example, 12:15:5).
	%ss Displays the second as a number with leading zeros
	(for example, 12:15:05).
	
	Utilização
	---------- 
	var s = new Date().formatBRExtended("São Paulo, %d de %MMMM de %yyyy.")
	* produz: São Paulo, 2 de maio de 2009.
	
	var s = new Date().formatBRExtended("%s %d-%N.")
	* produz: Sab 2-maio.
	
	Se precisar utilizar alguma das sequências especiais
	como literal, utilize contra-barra antes do percent:
	var s = new Date().formatBRExtended("\%S é o dia da semana: %S")
	* para 2/maio/2009 produz: %S é o dia da semana: sábado.
*/

	var debug = new String();
	format = format.toString();
	var d = this;
	var s = new String();
	// var s = new Array( d.getDate(), d.getMonth() + 1, d.getFullYear(), d.getHours(), d.getMinutes, d.getSeconds() );
	var arr = Array();
	// buscando os caracteres % marcados como literal: \%
	// substituímos por "\% "
	format = format.replace(/\\%/g, "\\% ");
	
	// procurando o dia da semana em 'formato'
	if (/%d{3,4}/.test(format)) {
		
		if (/%dddd/.test(format)) {
			arr = "domingo segunda terça quarta quinta sexta sábado".split(" ");
			var wd = arr[d.getDay()];
			format = format.replace(/%dddd/g, wd);
		} 
		if (/%ddd/.test(format)) {
			arr = "dom seg ter qua qui sex sáb".split(" ");
			var wd = arr[d.getDay()];
			format = format.replace(/%ddd/g, wd);
		} 
	}
	// procurando o dia do mês em 'formato'
	if (/[%d{1,2}]/.test(format)) {
		s = d.getDate();
		if (/%dd/.test(format)) { // 01 to 31
			s = parseFloat(s).toPaddedString(2);
			format = format.replace(/%dd/g, s);
		} else {
			if (/%d/.test(format)) { // 1 to 31
				format = format.replace(/%d/g, s);
			}
		} 
	}
	
	// procurando o mês em 'formato'
	if (/%M{3,4}/.test(format)) {
		// formato texto
		if (/%MMMM/.test(format)) { 
			arr = "janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro".split(" ");
			mes = arr[d.getMonth()]; 
			format = format.replace(/%MMMM/g, mes);
		} 
		if (/%MMM/.test(format)) { 
			arr = "jan fev mar abr mai jun jul ago set out nov dez".split(" ");
			mes = arr[d.getMonth()]; 
			format = format.replace(/%MMM/g, mes);
		} 
	}
	if (/%M{1,2}/.test(format)) {
		// formato numérico
		s = d.getMonth().toString();
		if (/%MM/.test(format)) { // 01 to 12
			if (s.length < 2 ) s = '0' + s;
			format = format.replace(/%MM/g, s);
			debug += format + "\n";
		} 
		if (/%M/.test(format)) { // 1 to 12
			format = format.replace(/%M/g, s);
		} 
	}
	
	// procurando o ano em 'formato'
	if (/[%yy|%yyyy]/.test(format)) {
		s = d.getFullYear().toString();
		if (/%yyyy/.test(format)) { // ano com 4 dígitos
			format = format.replace(/%yyyy/g, s);
		} 
		if (/%yy/.test(format)) { // ano com 2 dígitos
			format = format.replace(/%yy/g, s.toString().substr(2));
		} 
	}
	// procurando a hora em 'formato'
	if (/%H{1,2}/.test(format)) {
		s = d.getHours().toString();
		if (/%HH/.test(format)) { // hora com 2 dígitos
			if (s.length < 2 ) s = '0' + s;
			format = format.replace(/%HH/g, s);
		} 
		if (/%h/.test(format)) { // hora com 1 ou mais dígitos
			format = format.replace(/%H/g, s);
		} 
	}
	
	// procurando os minutos em 'formato'
	if (/%m{1,2}/.test(format)) {
		s = d.getMinutes().toString();
		if (/%mm/.test(format)) { // hora com 2 dígitos
			if (s.length < 2 ) s = '0' + s;
			format = format.replace(/%mm/g, s);
		} 
		if (/%m/.test(format)) { // hora com 1 ou mais dígitos
			format = format.replace(/%m/g, s);
		} 
	}
	// procurando os segundos em 'formato'
	if (/%s{1,2}/.test(format)) {
		s = d.getSeconds().toString();
		if (/%ss/.test(format)) { // hora com 2 dígitos
			if (s.length < 2 ) s = '0' + s;
			format = format.replace(/%ss/g, s);
		} 
		if (/%s/.test(format)) { // hora com 1 ou mais dígitos
			format = format.replace(/%s/g, s);
		} 
	}
	format = format.replace(/\\%\s/g, "%");
	return format;

};


String.prototype.removeSpecialChars = function()
{
  var chars = new Array (
  		'à','á','â','ã','ä','å','æ',
  		'è','é','ê','ë',
  		'ì','í','î','ï',
  		'ð','ò','ó','ô','õ','ö','ø',
  		'ù','ú','û','ü',
      'ç','ñ','ý','þ','ÿ',
  		'À','Á','Â','Ã','Ä','Å','Æ',
      'È','É','Ê','Ë',
      'Ì','Í','Î','Ï','Ð',
      'Ò','Ó','Ô','Õ','Ö','Ø',
      'Ù','Ú','Û','Ü',
      'Ç','Ñ','Ý','Þ','€',
      '\"','ß','<','>','¢',
      '£','¤','¥','¦','§',
      '¨','©','ª','«','¬',
      '­','®','¯','°','±',
      '²','³','´','µ','¶',
      '·','¸','¹','º','»',
      '¼','½','¾');
	var entities = new Array (
			'a','a','a','a','a','a','a',
			'e','e','e','e',
			'i','i','i','i','i',
			'o','o','o','o','o','o',
			'u','u','u','u',
			'c','n','y','y','y',
			'A','A','A','A','A','A','A',
			'E','E','E','E',
			'I','I','I','I','I',
			'O','O','O','O','O','O',
			'U','U','U','U',
			'C','N','Y','Y','Y',
			' ',' ',' ',' ',' ',
			' ',' ',' ',' ',' ',
			' ',' ','a',' ','-',
			'-','-','-','o',' ',
			'o',' ',' ',' ',' ',
			' ',' ',' ',' ',' ',
			' ',' ',' ');
  
	newString = this;
	myRegExp = new RegExp();
  for (var i = 0; i < chars.length; i++)
  {
    myRegExp.compile(chars[i],'g');
    newString = newString.replace (myRegExp, entities[i]);
  }
  return newString;
};

var Url = {
	/**
	*
	* URL encode / decode
	* http://www.webtoolkit.info/
	*
	*	para utilizar:
	* onkeyup="this.form.hash.value = Url.encode(this.value)"
	**/

	// public method for url encoding
	encode : function (string) {
		return escape(this._utf8_encode(string));
	},
	// public method for url decoding
	decode : function (string) {
		return this._utf8_decode(unescape(string));
	},
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
	  var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var c = 0;
		for (var i = 0; i < utftext.length; i++) {
	    c = utftext.charCodeAt(i);
	    if (c < 128) { string += String.fromCharCode(c);}
	    else if ((c > 191) && (c < 224)) {
				string += String.fromCharCode( ((c & 31) << 6) | (utftext.charCodeAt(++i) & 63)	);
			}
	    else {
				string += String.fromCharCode(
					((c & 15) << 12) | ((utftext.charCodeAt(++i) & 63) << 6) | (utftext.charCodeAt(++i) & 63));
			}
		}
		return string;
	}
};

function ShowHideNextSibling(obj) {
	var targetObj = $(obj).next();
	if ( targetObj ) {targetObj.toggleClassName('oculto');}
}

Number.prototype.FormatCurrency = function () {
	var s = this.toFixed(2).toString();
	s = s.replace(/\./, ",");
	// separador de milhar com vírgula
	var re = new RegExp(/(\d+)((\d\d\d)(,|\.)\d*)/);
	while ( re.test( s ) ) s = s.replace( re, '$1.$2' );
	return s;
};

Number.prototype.FormatDecimal = function (decimais) {
	var s = this.toFixed(decimais).toString();
	s = s.replace(/\./, ",");
	// separador de milhar com vírgula
	var re = new RegExp(/(\d+)((\d\d\d)(,|\.)\d*)/);
	while ( re.test( s ) ) s = s.replace( re, '$1.$2' );
	return s;
};

Number.prototype.FormatInteger = function () {
	var s = this.toFixed(0).toString();
	// separador de milhar com vírgula
	var re = new RegExp(/(\d+)(\d\d\d)$/);
	while ( re.test( s ) ) s = s.replace( re, '$1.$2' );
	return s;
};
