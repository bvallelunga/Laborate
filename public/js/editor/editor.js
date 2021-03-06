$(function() {
    CodeMirror.modeURL = "/codemirror/mode/%N/%N.js"

    window.editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: !config.embed,
        lineWrapping: false,
        matchBrackets: true,
        matchTags: true,
        extraKeys: {"Ctrl-J": "toMatchingTag"},
        tabMode: "indent",
        theme: "laborate",
        indentWithTabs: true,
        smartIndent: true,
        autofocus: !config.embed,
        dragDrop: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        highlightSelectionMatches: true,
        styleSelectedText: true,
        gutters: (config.embed) ? false : [
            "CodeMirror-linenumbers",
            "breakpoints"
        ]
    });

    window.editor.on("change", function(instance, changeObj) {
        window.editorUtil.setChanges("out", changeObj);
    });

    window.editor.on("gutterClick", function(cm, n) {
        window.editorUtil.gutterClick("out", [{"line":n}]);
    });

    window.editor.on("cursorActivity", function() {
        if(window.editor.getSelection()) {
            window.editorUtil.userCursors("out", {
                "selection": {
                    "from": window.editor.getCursor("start"),
                    "to": window.editor.getCursor("end")
                },
                "remove": false
            });
        } else {
            window.editorUtil.userCursors("out", {
                "cord": window.editor.getCursor("start"),
                "remove": false
            });
        }
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

        if("breakpoints" in data && !config.embed) {
            window.editorUtil.gutterClick("in", data.breakpoints);
        }

        if("docDelete" in data) {
            if(config.embed) {
                window.location.reload(true);
            } else {
                window.location.href = "/documents/";
            }
        }

        if("readonly" in data) {
            window.location.reload(true);
        }

        if("private" in data && config.embed) {
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
    if(!config.embed) {
        $(window).resize(function() {

            if($(window).width() < 1100) {
                window.editorUtil.fullscreen(true, false);
            }
        });
    }

    //Toogle Full Screen Mode
    $(".fullscreen-toggle").on("click", function() {
        window.editorUtil.fullscreen(!window.editorUtil.fullscreenActive);
    });

    //Toogle Terminal
    $(".terminal-toggle").on("click", function() {
        window.editorUtil.terminal();
    });

    $(".terminal").on("click", "a", function() {
        setTimeout(window.editorUtil.terminal, 200);
        return true;
    });

    //Prevent Ctrl/Command-S Popup
    $(document).keydown(function(event) {
        if(event.ctrlKey||event.metaKey) {
            if ([17, 83, 115].indexOf(event.which) != -1) {
                event.preventDefault();
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    });
});
