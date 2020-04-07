function setMsg(msg, display_alert) {
	msg = ( msg || '' );
	if (display_alert && msg != '') { alert(msg.stripTags()); }
	if($('panelMsg')) $('panelMsg').innerHTML = ( msg=='' ? 'Pronto.' : msg );
}

function clearMsg() {
	if($('panelMsg')) $('panelMsg').innerHTML = "&nbsp;";
}