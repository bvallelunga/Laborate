//Socket IO Configuration
window.nodeSocket = io.connect(window.config.host+":"+window.config.port, {
    "sync disconnect on unload": true
});

window.nodeSocket.on("reconnecting", function() {
    $("#editorCodeMirror").css({"opacity": ".5"});
    $(".backdropButton").val("Reconnecting...").attr("disabled", "disabled");
    window.editor.options.readOnly = true;
    window.notification.open("Reconnecting...", true);
});

window.nodeSocket.on("connect", function() {
    $(".backdropButton").val("Join Document").attr("disabled", false);
    window.notification.close();
    window.editor.options.readOnly = false;
    $("#editorCodeMirror").css({"opacity": ""});
});

window.nodeSocket.on("reconnect", function() {
    if(!$("#backdrop").is(":visible")) {
        window.nodeSocket.emit("editorJoin", [window.editorUtil.document_hash, true], function(json) {
            if(!json.success) {
                if(json.error_message) {
                    window.editorUtil.error(json.error_message, json.redirect_url);
                } else {
                    window.location.href = json.redirect_url;
                }
            }
        });
    }
});

window.nodeSocket.on('connect_failed', function () {
    window.editorUtil.error("Failed To Connect. Retrying now...", true);
});

window.nodeSocket.on('reconnect_failed', function () {
    window.editorUtil.error("Failed To Reconnect. Retrying now...", true);
});

window.nodeSocket.on('error', function (reason){
    window.editorUtil.error(reason, true);
});

//Url Parameters
window.url_params = function() {
    params = /\/editor\/(\d*)/.exec(window.location.href);
    params_dict = {};
    params_dict["document"] = (params) ? params[1] : null;
    return params_dict;
}

$(window).ready(function() {
    //Set Array of Users
    window.users = new Array();

    //Set Title
    window.sidebarUtil.setTitle("in", $("#document_title").text());

    //Refresh Editor
    window.editorUtil.refresh();
});
