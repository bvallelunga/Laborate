$(function() {
    CodeMirror.modeURL = "/codemirror/mode/%N/%N.js"

    window.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        lineWrapping: false,
        matchBrackets: true,
        matchTags: true,
        extraKeys: {"Ctrl-J": "toMatchingTag"},
        tabMode: "indent",
        theme: "laborate",
        indentUnit: 4,
        indentWithTabs: true,
        smartIndent: true,
        autofocus: true,
        dragDrop: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        highlightSelectionMatches: true,
        styleSelectedText: true,
        styleActiveLine: false,
        showTrailingSpace: true,
        gutters: ["CodeMirror-linenumbers", "breakpoints"]
    });

    window.editor.on("change", function(instance, changeObj) {
        window.editorUtil.setChanges("out", changeObj);
    });

    window.editor.on("gutterClick", function(cm, n) {
        window.editorUtil.gutterClick("out", [{"line":n}]);
    });

    window.editor.on("cursorActivity", function() {
        window.editorUtil.userCursors("out", {"line":window.editor.getCursor().line, "remove":false});
    });

    window.editor.on("blur", function() {
        window.editorUtil.userCursors("out", {"remove":true});
    });

    //Pull Document Changes
    window.socketUtil.socket.on('editorDocument', function (data) {
        window.editorUtil.setChanges("in", data["changes"]);
    });

    //Pull Cursor Info
    window.socketUtil.socket.on('editorCursors', function (data) {
        window.editorUtil.userCursors("in", data);
    });

    //Pull Extras Info
    window.socketUtil.socket.on('editorExtras', function (data) {
        if("laborators" in data) {
            window.sidebarUtil.laborators();
        }

        if("docName" in data) {
            window.sidebarUtil.setTitle("in", data.docName, window.chat.count);
        }

        if("breakpoints" in data) {
            window.editorUtil.gutterClick("in", data.breakpoints);
        }

        if("docDelete" in data) {
            window.location.href = "/documents/";
        }

        if("readonly" in data) {
            window.location.reload(true);
        }
    });

    //Pull Errors
    window.socketUtil.socket.on('editorError', function (data) {
        if(data) {
            if(data.error_message) {
                window.editorUtil.error(data.error_message, data.redirect_url);
            } else if(data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        }
    });

    //Focus Editor On Click
    $("#editorContainer").on("click", function() {
        window.editor.focus();
    });

    //Resize Editor on Window Resize
    $(window).resize(function() {
        window.editorUtil.resize();
    });

    //Toogle Full Screen Mode
    $(".fullscreen").on("click", function() {
        window.editorUtil.fullscreen(window.editorUtil.fullscreenActive);
    });
});
