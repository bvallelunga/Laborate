//Prevent Form Redirect
$("form").live("submit", function() { return false; });

$(window).ready(function() {
    $("body div").not("#backdrop, #backdrop div").hide();
    $("body").show();

    //Auto center backdrop core
	$("#backdropCore").vAlign().hAlign();

	//Turn Off Spell Check
    $("#backdrop input[type=text]").attr({"spellcheck": false});
});