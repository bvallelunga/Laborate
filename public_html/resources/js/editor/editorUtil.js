/////////////////////////////////////////////////
//          Editor Instances
/////////////////////////////////////////////////
window.editorUtil = {
    clean: true,
    setChanges: function(direction, data) {
        if(data['origin'] != "setValue") {
            if(direction == "out") {
                if(window.editorUtil.clean) {
                    window.nodeSocket.emit( 'editor' , { "from": window.userId, "changes": data } );
                } else {
                    window.editorUtil.clean = true;
                }
            }

            if(direction == "in") {
                if(window.editorUtil.clean) {
                    window.editorUtil.clean = false;
                    window.editor.replaceRange(data['text'], data['from'], data['to']);
                } else {
                    window.editorUtil.clean = true;
                }
            }
        }
    },
    gutterClick: function(direction, data) {
        var info = window.editor.lineInfo(data[0]);
        var marker = document.createElement("div");
        marker.className ="CodeMirror-breakpoint";
        marker.innerHTML = "●";
        if(direction == "out") {
            window.editor.setGutterMarker(data[0], "breakpoints", info.gutterMarkers ? null : marker);
            window.nodeSocket.emit( 'editor' , {"from": window.userId, "extras": {"lineMarker": [data[0], info.gutterMarkers]}} );
        }

        if(direction == "in") {
            window.editor.setGutterMarker(data[0], "breakpoints", data[1] ? null : marker);
        }
    },
    users: function(id, name, remove) {
        if(remove && $.inArray(id, window.users) > -1) {
            $("#document_contributors").find("[data=" + id + "]").remove();
            delete window.users[id];
            window.editorUtil.userCursors("in", {"from":id, "remove":true})
        }
        else {
            if($.inArray(id, window.users) == -1) {
                $("<style type='text/css'> .u" + id + "{background:" + randomUserColor() + " !important;} </style>").appendTo("head");
                var contributor = '<div class="contributor u'+id+'" data="'+id+'" userName="'+name+'"></div>';
                $("#document_contributors").append(contributor);
                window.users.push(id);
            }
            else {
                $("#document_contributors").find("[data=" + id + "]").attr("userName", name);
            }
        }
    },
    userHover: function(element) {
        $("#contributor_info #contributor_info_name").text(element.attr("username"));
        if(element.index() == 0) { var extra = 0; }
        else { var extra = 5; }
        var contributor_box_offset = element.offset().left - (element.width()/2);
        var contributor_info = $("#contributor_info").width()/2;
        $("#contributor_info").show().css("left", (contributor_box_offset - contributor_info) + "px");
    },
    userLeave: function() {
        $("#contributor_info").hide().css("left", "0px");
        $("#contributor_info #contributor_info_name").text("");
    },
    userCursors: function(direction, data) {
        if(direction == "out") {
            if(data['remove']) {
                window.nodeSocket.emit('cursors' , {"from":window.userId, "remove":true} );
            } else {
                window.nodeSocket.emit('cursors' , {"from":window.userId, "line":data['line']} );
            }
        }

        if(direction == "in") {
            if(data['remove']) {
                window.editor.removeLineClass(window.cursors[data['from']], "", ("u"+data['from']));
                delete window.cursors[data['from']];
            }
            else {
                if(data['from'] in window.cursors) {
                    window.editor.removeLineClass(window.cursors[data['from']], "", ("u"+data['from']));
                }
                window.editor.addLineClass(data['line'], "", ("u"+data['from']));
                window.cursors[data['from']] = data['line'];
            }
        }
    },
    refresh: function() {
        var header = parseInt($("#header").height());
        var window_height = parseInt($(window).height());

        if($("#header").is(":visible")) {
            editor.getWrapperElement().style.height = (window_height - header - 38) + "px";
        } else {
           editor.getWrapperElement().style.height = (window_height - header - 68) + "px";
        }

        editor.refresh();
    },
    format: function(whole_document) {
        if(whole_document) {
            start = {"ch":0, "line": 0};
            end = {"ch":editor.getValue().length, "line": editor.lineCount()};
        }
        else {
            start = editor.getCursor("start");
            end = editor.getCursor();
        }
        editor.autoFormatRange(start, end);
        editor.autoIndentRange(start, end);
        editor.refresh();
        editor.setSelection(editor.getCursor(), editor.getCursor());
    },
    highlight: function(line) {
        sidebar('find');
        if(line.length != 0 && window.editor.getValue().length != 0 && /[^0-9,-]/.test(line) == false) {
            var lines = line.split(",");
            var part1 = "<div class='header clear'>";
            part1 += "<div class='listColor' style='background:#B4D5E8;'></div>";
            part1 += "<div class='left'>";
            var part2 = "</div><div class='listX right'></div>";
            part2 += "<div class='clear'></div>";

            for (var a = 0; a < lines.length; ++a) {
                var line = $.trim(lines[a]);

                if(line.length != 0) {
                    lineSplit = line.split("-");

                    if(lineSplit.length == 1) {
                        var range = [parseInt(line)];
                        $("#lineNumberList").append(part1 + "<span class='listContent'>" + lineSplit[0] + "</span>" + part2);
                    }
                    else {
                        var range = createRange(parseInt(lineSplit[0]), parseInt(lineSplit[1]) + 1.0);
                        $("#lineNumberList").append(part1 + "<span class='listContent'>" + lineSplit[0] + "-" + lineSplit[1] + "</span>" + part2);
                    }

                    for (var b = 0; b < range.length; ++b) {
                        window.editor.setLineClass(range[b] - 1, "highLightLine");

                    }
                }
            }
        }
    },
    highlightRemove: function(parent) {
        var lineSplit = parent.find(".listContent").text().split("-");
        parent.remove();

        if(lineSplit.length == 1) { range = [parseInt(lineSplit[0])];}
        else { range = createRange(parseInt(lineSplit[0]), parseInt(lineSplit[1]) + 1.0); }

        for (var c = 0; c < range.length; ++c) {
            window.editor.setLineClass(range[c] - 1, "");
        }
    },
    search: function(pattern) {
        sidebar('find');
        if(pattern.length != 0 && window.editor.getValue().length != 0) {
            function SearchState() {
                this.posFrom = this.posTo = this.query = null;
                this.marked = [];
            }

            function getSearchState() {
                return editor._searchState || (editor._searchState = new SearchState());
            }

            window.searchList = window.searchList || {}
            var key = Math.floor((Math.random()*10000)+1);
            window.searchList[key] = new Array();
            color = randomFunctionalColor();
            $("<style type='text/css'> .h" + key + "{background:" + color + ";} </style>").appendTo("head");
            for (var cursor = editor.getSearchCursor(pattern); cursor.findNext();) {
                marked = editor.markText(cursor.from(), cursor.to(), "h" + key)
                window.searchList[key].push(marked);
                getSearchState().marked.push(marked);
            }

            var li = "<div class='header clear " + key + "'>";
            li += "<div class='listColor' style='background:" + color + "'></div>";
            li += "<div class='listContent left'></div>" ;
            li += "<div class='listX right' data='" + key + "'></div>";
            li += "<div class='clear'></div>";
            $("#findList").append(li).find("." + key + " .listContent").text(pattern);
            $("#findList").find("." + key).removeClass(key + "");
            var state = getSearchState();
            state.query = null;
            state.marked.length = 0;
        }
    },
    searchRemove: function(element) {
        var state = window.searchList[parseInt(element.attr("data"))];
        for (var i = 0; i < state.length; ++i) {
            state[i].clear();
        }
        delete window.searchList[parseInt(element.attr("data"))];
        element.parent().remove();
    },
    scroll: function(i) {
        window.editor.scrollIntoView({"ch":"0", "line": (i - 1) + ""}, 500)
    },
    setTitle: function(title) {
        $("#documentTitle").val(title);
        $("#document_title").text(title);
        setEditorMode(title.split(".")[title.split(".").length - 1]);
        $("title").text(title + " · Code-Laborate");
        window.nodeSocket.emit( 'editor' , {"from": window.userId, "extras": {"docName": $("#documentTitle").val()}} );
    },
    fullScreen: function() {
        if($("#header").is(":visible")) {
            $("#editorCodeMirror").css({"margin":" 30px auto 0 auto", "width": "90%"});
            $("#full_screen").addClass("icon-contract");
            $("#full_screen").removeClass("icon-expand");
            $("#full_screen").css({"font-size": "24px", "margin": "0 0 0 30px"});
            $("#sidebar, #header, #chatRoom").hide();
        } else {
            $("#editorCodeMirror").css({"margin": "", "width": ""});
            $("#full_screen").addClass("icon-expand");
            $("#full_screen").removeClass("icon-contract");
            $("#full_screen").css({"font-size": "", "margin": ""});
            $("#sidebar, #header, #chatRoom").show();
        }

        window.editor.refresh();
        window.editorUtil.refresh();
    },
    passwordCheck: function(callback) {
        $.post("/php/session/password_check.php", { session_id: getUrlVars()['i'], session_password: $("#backdropPassword").val() },
            function(password_response){
                if(password_response != "Password Authentication: Failed") {
                    callback(password_response);
                }
                else {
                    callback(false);
                }
            }
        );
    },
    downloadFile: function() {
        window.editorUtil.passwordCheck(function(callback) {
            if(callback) {
                window.location.href = "/php/session/download_file.php?i=" + callback;
            }
            else {
                $("#downloadFile").addClass("red_harsh").val("Download Failed");
                setTimeout(function() {
            		$("#downloadFile").removeClass("red_harsh").val("Download File");
        		}, 5000);
            }
        });
    },
    printFile: function() {
        var url = "/print/?i="+ getUrlVars()['i'] + "&p="+ window.passTemplate + "&t=" + $("#document_title").text();
        printWindow = window.open(url, 'title', 'width=800, height=500, menubar=no,location=no,resizable=no,scrollbars=no,status=no');
    },
    commitFile: function() {
        window.editorUtil.passwordCheck(function(callback) {
            if(callback) {
                $("#githubCommit").removeClass("red_harsh").val("Commiting File...");
                if($("#githubReference").val() != "") { var related = "\n\Issue: #" + $("#githubReference").val(); }
                else { var related = ""; }
                $.post("/php/locations/github_commit.php", { commit_id: callback,
                                                                   session_document: window.editor.getValue(),
                                                                   message: $("#githubMessage").val() + related },
                    function(result){
                        if(result == "Commit Succeeded") {
                            $("#githubCommit").val("File Commited").removeClass("red_harsh");
                            $("#githubMessage, #githubReference").val("");
                            setTimeout(function() {
                        		$("#githubCommit").removeClass("red_harsh").val("Commit File");
                    		}, 5000);
                        }
                        else {
                            $("#githubCommit").addClass("red_harsh").val("Commit Failed");
                            setTimeout(function() {
                                $("#githubCommit").removeClass("red_harsh").val("Commit File");
                            }, 5000);
                        }
                    }
                );
            }
            else {
                $("#githubCommit").addClass("red_harsh").val("Commit Failed");
                setTimeout(function() {
                    $("#githubCommit").removeClass("red_harsh").val("Commit File");
                }, 5000);
            }
        });
    },
    pushFile: function() {
        window.editorUtil.passwordCheck(function(callback) {
            if(callback) {
                $("#saveToServer").removeClass("red_harsh").val("Saving File...");
                $.post("/php/locations/sftp_push.php", {
                                                        commit_id: callback,
                                                        session_document: window.editor.getValue(),
                                        },
                    function(result){
                        if(result == "File Pushed") {
                            $("#saveToServer").val("File Saved").removeClass("red_harsh");
                            setTimeout(function() {
                        		$("#saveToServer").removeClass("red_harsh").val("Save To Server");
                    		}, 5000);
                        }
                        else {
                            $("#saveToServer").addClass("red_harsh").val("Save Failed");
                            setTimeout(function() {
                        		$("#saveToServer").removeClass("red_harsh").val("Save To Server");
                    		}, 5000);
                        }
                    }
                );
            }
            else {
                $("#saveToServer").addClass("red_harsh").val("Save Failed");
                setTimeout(function() {
                   $("#saveToServer").removeClass("red_harsh").val("Save To Server");
        		}, 5000);
            }
        });
    }
}