window.sidebarUtil = {
	change: function(module, permanent) {
	    var element = $(".sidebar .options .option[data-key='" + module + "']");
	    if(module != false || permanent) {
	        $(".sidebar").addClass("active");
	        $(".sidebar .pane > .item").hide();
            $(".sidebar .pane > .item[data-key='" + module + "']").show();
            $(".sidebar .header .title").text(element.find(".name").text());
        } else {
            $(".sidebar").removeClass("active");
            $(".sidebar .header .title").text("Navigation");
        }
	},
	submit: function(form) {
        switch(form.attr("name")) {
            case "undo":
                window.editor.undo();
                break;
            case "redo":
                window.editor.redo();
                break;
            case "type-mode":
                this.typeMode(
                    form.find("select[name=languages]").val(),
                    form.find("select[name=keymapping]").val(),
                    (form.find("select[name=cursorSearch]").val() === "true"),
                    (form.find("select[name=whiteSpace]").val() === "true"),
                    parseInt(form.find("select[name=tabs]").val())
                );
                break;
            case "beautify":
                this.beautify(form.find("select").val());
                break;
            case "line-jump":
                this.jumpToLine(form.find("input").val());
                form.find("input").val("");
                break;
            case "highlight-line":
                this.highlight(form.find("input").val());
                form.find("input").val("");
                break;
            case "highlight-word":
                this.search(form.find("input").val());
                form.find("input").val("");
                break;
            case "invite":
                this.invite(form.find("input").val());
                form.find("input").val("");
                break;
            case "commit":
                this.commit(form.find("textarea").val());
                form.find("textarea").val("");
                break;
            case "save":
                this.save();
                break;
            case "print":
                this.print();
                break;
            case "download":
                this.download();
                break;
            case "settings":
                this.settings(
                    form.find("input[name=name]").val(),
                    (form.find("select[name=private]").val() === "true"),
                    (form.find("select[name=readonly]").val() === "true")
                );
                break;
            case "remove":
                this.remove(form);
                break;
        }
	},
	populateLanguages: function() {
        var languages = "";
        $.each(window.editorUtil.languages, function(language, mode) {
            languages += "<option value='" + language + "'>" + language + "</option>";
        });

        $(".form[name='type-mode'] select[name='languages']").html(languages);
	},
	defaultLanguage: function(language) {
        $(".form[name='type-mode'] select[name='languages'] option")
            .filter(function() {
                return ($(this).text() == language);
            })
            .prop('selected', true);
	},
	defaultKeymap: function(keymap) {
	    if(keymap) {
    	    $(".form[name='type-mode'] select[name='keymapping'] option")
                .filter(function() {
                    return ($(this).val() == keymap);
                })
                .prop('selected', true);
        }
	},
	defaultCursorSearch: function(cursorSearch) {
    	if(cursorSearch) {
    	    $(".form[name='type-mode'] select[name='cursorSearch'] option")
                .filter(function() {
                    return ($(this).val() == cursorSearch);
                })
                .prop('selected', true);
        }
	},
	defaultWhiteSpace: function(whiteSpace) {
    	if(whiteSpace) {
    	    $(".form[name='type-mode'] select[name='whiteSpace'] option")
                .filter(function() {
                    return ($(this).val() == whiteSpace);
                })
                .prop('selected', true);
        }
	},
	defaultTabs: function(tabs) {
	    if(tabs) {
    	    $(".form[name='type-mode'] select[name='tabs'] option")
                .filter(function() {
                    return ($(this).val() == tabs);
                })
                .prop('selected', true);
        }
	},
	typeMode: function(languages, keymapping, cursorSearch, whiteSpace, tabs) {
	    window.editorUtil.setModeLanguage(languages);
        this.keyMap(keymapping);
        this.cursorSearch(cursorSearch);
        this.whiteSpace(whiteSpace);
        this.tabs(tabs);
	},
	tabs: function(tabs) {
        tabs = tabs || 4;
    	window.editor.setOption("indentUnit", tabs);
    	$.cookie("tabs", tabs, {
            path: '/editor',
            expires: 365
        });
	},
	whiteSpace: function(whiteSpace) {
    	window.editor.setOption("showTrailingSpace", whiteSpace);
        $.cookie("whiteSpace", whiteSpace, {
            path: '/editor',
            expires: 365
        });
	},
	keyMap: function(keymap) {
	    if(keymap) {
    		window.editor.setOption("keyMap", keymap);
    		$.cookie("keyMap", keymap, {
                path: '/editor',
                expires: 365
            });
        }
	},
	cursorSearch: function(cursorSearch) {
        window.editor.setOption("highlightSelectionMatches", cursorSearch);
        $.cookie("cursorSearch", cursorSearch, {
            path: '/editor',
            expires: 365
        });
	},
	setAccess: function(access) {
        $(".filter[data-key='file-access'] strong").text(access);
	},
	setTitle: function(direction, title, notification) {
	    var name = (notification) ? title.slice(0,17) : title;
	    var notify = (notification) ? ("(" + notification + ")") : "";
	    var extension = title.split(".")[title.split(".").length - 1];
	    if(!notification) window.editorUtil.setModeExtension(extension);
	    window.editorUtil.name = title;

        $(".sidebar .form[name=settings] .input[name=name]").val(title);
		$(".subheader .filter[data-key='file-name'] strong").text(title);
		$("title").text(name + notify + window.config.delimeter + window.config.name);
		if(direction == "out") {
    		window.socketUtil.socket.emit('editorExtras' , {
    		    docName: title
            });
        }
	},
	togglePassword: function(active) {
        $(".form[name='settings'] input[name='password']")
            .val("")
            .prop("disabled", active);
	},
	beautify: function(select) {
	    window.editor.operation(function() {
	        if(select == "selection") {
                var start = window.editor.getCursor("start").line;
                var end = window.editor.getCursor("end").line;
	        } else {
    	        var start = window.editor.firstLine();
                var end = window.editor.lastLine();
	        }

            window.editor.eachLine(start, end, function(line) {
                window.editor.indentLine(
                    window.editor.getLineNumber(line),
                    "smart"
                );
            });
	    });
	},
	jumpToLine: function(line) {
	    try {
    	    line -= 1;
            window.editor.scrollIntoView({
                line: line,
                ch: 0
            });

            window.editor.addLineClass(line, "text", "CodeMirror-linejump");
            setTimeout(function() {
                window.editor.removeLineClass(line, "text", "CodeMirror-linejump");
            }, 5000);
        } catch(error) {
            return error;
        }
	},
	highlight: function(lines) {
	    if(lines && window.editor.getValue().length != 0) {
    	    try {
        	    var _this = this;
        	    _this.change("search", true);
        	    window.editor.operation(function() {
                    $.each(_this.highlightRange(lines), function(key, value) {
                        if(typeof value == "number") {
                            _this.highlightListing(value);
                            window.editor.addLineClass(value, "text", "CodeMirror-highlighted");
                        } else if(typeof value == "object") {
                            _this.highlightListing(value);
                            for (var line = value.from; line < value.to; line++) {
                                window.editor.addLineClass(line, "text", "CodeMirror-highlighted");
                            }
                        }
                    });
                });
            } catch(error) {
                return error;
            }
        }
	},
	highlightRemove: function(lines) {
	    var _this = this;
	    _this.change("search", true);
	    $(".sidebar .form[name='highlight-line'] .item[data-lines='" + lines + "']").remove();
        window.editor.operation(function() {
            $.each(_this.highlightRange(lines), function(key, value) {
                if(typeof value == "number") {
                    window.editor.removeLineClass(value, "text", "CodeMirror-highlighted");
                } else if(typeof value == "object") {
                    for (var line = value.from; line < value.to; line++) {
                        window.editor.removeLineClass(line, "text", "CodeMirror-highlighted");
                    }
                }
            });
        });
	},
	highlightRange: function(lines) {
        return $.map(lines.split(","), function(line) {
            if(line) {
                if(line.indexOf("-") != -1) {
                    line = line.split("-");

                    if(isNaN(line[0]) || isNaN(line[1])) {
                        throw Error("Invalid Lines");
                    } else {
                        return {
                            from: parseInt(line[0]-1),
                            to: parseInt(line[1])
                        }
                    }
                } else {
                    if(isNaN(line)) {
                        throw Error("Invalid Lines");
                    } else {
                        return parseInt(line-1);
                    }
                }
            }
        });
	},
	highlightListing: function(lines) {
	    if(typeof lines == "number") {
	        lines += 1;
	        var lines_formatted = "Line: " + lines;
	    } else {
	        lines = (lines.from + 1) + " - " + lines.to;
	        var lines_formatted = "Lines: " + lines;
	    }

    	$(".sidebar .form[name='highlight-line'] .listing")
    	    .append("                                                                       \
                <div class='item' data-lines='" + lines + "'>                               \
                    <div class='name'>" + lines_formatted + "</div>                         \
                    <div class='remove " + window.config.icons.cross_square + "'></div>     \
                </div>                                                                      \
    	    ");
	},
	search: function(search) {
    	if(search && window.editor.getValue().length != 0) {
    	    try {
        	    var _this = this;
        	    this.change("search", true);

        	    window.editor.operation(function() {
                    var key = Math.floor((Math.random()*10000)+1);
                    var color = randomColor();

                    _this.searchList[key] = [];
                    _this.searchListing(key, search);

                    $("<style type='text/css'>.s" + key + "{background:" + color + ";}</style>").appendTo("head");

                    for (var cursor = window.editor.getSearchCursor(search); cursor.findNext();) {
                        var marked = window.editor.markText(cursor.from(), cursor.to(), {
                            "className": "s" + key
                        });

                        _this.searchList[key].push(marked);
                    }
                });
            } catch(error) {
                return error;
            }
        }
	},
	searchRemove: function(search) {
	    var _this = this;
        var state = _this.searchList[parseInt(search)];
        window.editor.operation(function() {
            for (var i = 0; i < state.length; ++i) {
                    state[i].clear();
            }
            delete _this.searchList[parseInt(search)];
            $(".sidebar .form[name='highlight-word'] .item[data-search='" + search + "']")
                .remove();
        });
	},
	searchListing: function(key, search) {
    	$(".sidebar .form[name='highlight-word'] .listing")
    	    .append("                                                                       \
                <div class='item' data-search='" + key + "'>                                \
                    <div class='name'>" + $('<div/>').text(search).html() + "</div>         \
                    <div class='remove " + window.config.icons.cross_square + "'></div>     \
                </div>                                                                      \
    	    ");
	},
	searchList: {},
	invite: function(screen_name) {
	    if(screen_name) {
            var _this = this;
            var button = $(".form[name='invite'] .button");
            var error = $(".form[name='invite'] .error_message");

            _this.buttonLoading(button);

            $.post("/editor/" + url_params()["document"] + "/invite/", {
                screen_name: screen_name,
                _csrf: window.config.csrf
            }, function(json) {
                if(json.success) {
                    error.slideUp(200);
                    _this.laborators();
                    _this.buttonSuccess(button);
                } else {
                    _this.buttonReset(button);
                    error
                        .text(json.error_message.toLowerCase())
                        .slideDown(200);

                    _this.inviteTimeout = setTimeout(function() {
                        error.slideUp(200);
                    }, 3000);
                }
            });
        }
	},
	inviteTimeout: null,
	laborators: function() {
	    if(!config.embed) {
    	    async.parallel({
    	        laborators: function(callback) {
                    $.post("/editor/" + url_params()["document"] + "/laborators/", {
                        _csrf: window.config.csrf
                    }, function(json) {
                        callback(json.error_message, json.laborators);
                    });
    	        },
    	        online: function(callback) {
    	            window.socketUtil.socket.emit("editorLaborators", function(json) {
                        window.editorUtil.users(json.laborators);
                        callback(null, json.laborators);
                    });
    	        }
    	    }, function(error, data) {
                var permissions = $.map(window.config.permissions, function(permission, key) {
                    return {
                        id: key,
                        name: permission.toLowerCase(),
                        count: 0
                    }
                });

        	    $(".sidebar .form[name='invite'] .laborators").html("");

                $.each(data.laborators, function(key, laborator) {
                    var item = "";

                    if(data.online.indexOf(laborator.id) != -1) {
                        permissions[laborator.permission.id-1].count++;
                        item += " active";
                    }

                    if(config.permission.owner) {
                        var settings = "settings " + config.icons.settings;

                        if(!laborator.permission.access) {
                            item += " blocked";
                        }
                    } else {
                        if(!laborator.permission.access) {
                            return true;
                        } else {
                            var settings = "";
                        }
                    }

                    $(".sidebar .form[name='invite'] .laborators")
                        .append("                                                                              \
                            <div class='item " + item + "'                                                     \
                                 data-id='" + laborator.id + "'                                                \
                                 data-permission='" + laborator.permission.id + "'>                            \
                                 <div class='gravatar'>                                                        \
                                    <img src='" + laborator.gravatar + "'>                                     \
                                 </div>                                                                        \
                                 <a class='name' href='/users/" + laborator.screen_name + "/' target='_blank'> \
                                    " + laborator.screen_name + "                                              \
                                 </a>                                                                          \
                                 <div class='" + settings + "'></div>                                          \
                                 <div class='bubble u" + laborator.id + "'><div></div></div>                   \
                            </div>                                                                             \
                        ");

                    if(data.laborators.end(key)) {
                        var header = [];
                        var delimiter = "<span>" + window.config.delimeter + "</span>";
                        permissions[1].count += permissions[0].count;

                        if(permissions[1].count != 0) {
                            var editors = permissions[1].count + " " + permissions[1].name;
                            if(permissions[1].count != 1) editors += "s";
                            header.push(editors);
                        }

                        if(permissions[2].count != 0) {
                            var viewers = permissions[2].count + " " + permissions[2].name;
                            if(permissions[2].count != 1) viewers += "s";
                            header.push(viewers);
                        }

                        if(!header.empty) {
                            if(permissions[1].count == 0 && permissions[2].count == 0) {
                                $(".chat .header").text("Chat Room");
                            } else {
                                $(".chat .header").html(header.join(delimiter));
                            }
                        } else {
                            $(".chat .header").text("Chat Room");
                        }
                    }
                });
    	    });
        } else {
            window.socketUtil.socket.emit("editorLaborators", function(json) {
                window.editorUtil.users(json.laborators);
            });
        }
	},
	laboratorOpen: function(location, user) {
        $(".context-menu")
            .css({
                "top": location.top - ($(".context-menu").height()/2) + 8,
                "left": location.left + 26
            })
            .attr({
                "data-id": user
            })
            .show();
	},
	laboratorChange: function(user, permission) {
	    var _this = this;
        $.post("/editor/" + url_params()["document"] + "/laborator/" + user + "/", {
            permission: permission,
            _csrf: window.config.csrf
        }, function(json) {
            if(json.success) {
                _this.laborators();
                window.socketUtil.socket.emit('editorPermission', user);
                window.socketUtil.socket.emit('editorExtras', {
        		    laborators: true
                });
            }
        });
	},
	commit: function(message) {
	    var _this = this;
	    var button = $(".sidebar .form[name=commit] .button");

	    _this.buttonLoading(button);

	    window.socketUtil.socket.emit('editorSave', function(json) {
	       if(json.success) {
                $.post("/editor/" + url_params()["document"] + "/commit/", {
                    message: message,
                    _csrf: window.config.csrf
                }, function(json) {
                    if(json.success) {
                        _this.buttonSuccess(button);
                    } else {
                        _this.buttonError(button, json.error_message);
                    }
                });
            } else {
                _this.buttonError(button);
            }
	    });
	},
	save: function() {
        var _this = this;
	    var button = $(".sidebar .form[name=save] .button");

	    _this.buttonLoading(button);

	    window.socketUtil.socket.emit('editorSave', function(json) {
	       if(json.success) {
                $.post("/editor/" + url_params()["document"] + "/save/", {
                    _csrf: window.config.csrf
                }, function(json) {
                    if(json.success) {
                        _this.buttonSuccess(button);
                    } else {
                        _this.buttonError(button, json.error_message);
                    }
                });
            } else {
                _this.buttonError(button);
            }
	    });
	},
	print: function() {
        $("html").addClass("print");

        setTimeout(function() {
            window.editor.refresh();
            window.print();

            setTimeout(function() {
                $("html").removeClass("print");
            }, 100);
        }, 600);
	},
	download: function() {
        var _this = this;
	    var button = $(".sidebar .form[name=download] .button");

	    _this.buttonLoading(button);

	    window.socketUtil.socket.emit('editorSave', function(json) {
	       if(json.success) {
                $.fileDownload("/editor/" + url_params()["document"] + "/download/")
                    .done(function() {
                        _this.buttonSuccess(button);
                    })
                    .fail(function() {
                        _this.buttonError(button);
                    });
            } else {
                _this.buttonError(button);
            }
	    });
	},
	settings: function(name, private, readonly) {
	    var _this = this;
	    var button = $(".sidebar .form[name=settings] .button");

	    _this.buttonLoading(button);

	    window.socketUtil.socket.emit('editorSave', function(json) {
	       if(json.success) {
                $.post("/editor/" + url_params()["document"] + "/update/", {
                    name: name,
                    private: private,
                    readonly: readonly,
                    _csrf: window.config.csrf
                }, function(json) {
                    if(json.success) {
                        _this.setTitle("out", name, window.chat.count);
                        _this.buttonSuccess(button);

                        if(json.changeReadonly) {
                            window.socketUtil.socket.emit('editorExtras', {
                    		    readonly: true
                            });
                        }

                        if(json.changePrivate) {
                            window.socketUtil.socket.emit('editorExtras', {
                    		    private: true
                            });
                        }
                    } else {
                        _this.buttonError(button, json.error_message);
                    }
                });
            } else {
                _this.buttonError(button);
            }
	    });
	},
	remove: function() {
        var _this = this;
	    var button = $(".sidebar .form[name=remove] .button");

	    _this.buttonLoading(button);

        $.post("/editor/" + url_params()["document"] + "/remove/", {
            _csrf: window.config.csrf
        }, function(json) {
            if(json.success) {
                _this.buttonSuccess(button);

                if(json.owner) {
                    window.socketUtil.socket.emit('editorExtras', {
                        docDelete: true
                    });
                } else {
                    window.socketUtil.socket.emit('editorExtras', {
            		    laborators: true
                    });
                }

                setTimeout(function() {
                    window.location.href = "/documents/";
                }, 100);
            } else {
                _this.buttonError(button, json.error_message);
            }
        });
	},
	buttonReset: function(button) {
    	button
            .removeClass("error success")
    	    .html(button.attr("data-original"))
    	    .attr({
                "disabled": null,
            });
	},
	buttonLoading: function(button) {
	    if(!button.is(":disabled")) {
            button
                .attr({
                    "disabled": "disabled",
                    "data-original": button.html()
                })
                .removeClass("error success")
                .html(button.attr("data-loading") || "loading...");
        }
	},
	buttonSuccess: function(button) {
        var _this = this;
    	if(!button.hasClass("success")) {
        	button
                .attr("disabled", null)
                .removeClass("error")
                .addClass("success")
                .html(button.attr("data-success") || button.attr("data-original"));

            setTimeout(function() {
                 _this.buttonReset(button);
            }, 4000);
    	}
	},
	buttonError: function(button, message) {
	    var _this = this;
    	if(!button.hasClass("error")) {
        	button
                .attr("disabled", null)
                .addClass("error")
                .removeClass("success")
                .html(message || "Failed");

            setTimeout(function() {
                 _this.buttonReset(button);
            }, 4000);
    	}
	},
	screenNames: function(screen_name) {
	    var _this = $(".sidebar .form[name='invite'] .screen_names");

	    if(screen_name) {
            $.post("/users/", {
                _csrf: window.config.csrf,
                user: screen_name
            }, function(json) {
                if(json.success && !json.users.empty) {
                    _this.slideDown(200);

                    setTimeout(function() {
                        _this.html(
                            $.map(json.users, function(user) {
                                var name = user.screen_name.replace(new RegExp(screen_name , "i"), '<span>$&</span>');

                                return ("                                      \
                                    <div class='item'                          \
                                        data-name='" + user.screen_name + "'>  \
                                         <div class='gravatar'>                \
                                            <img src='" + user.gravatar + "'>  \
                                         </div>                                \
                                         <div class='name'>" + name + "</div>  \
                                    </div>                                     \
                                ");
                            }).join("")
                        );
                    }, 300);
                } else {
                    _this.html("").slideUp(200);
                }
            });
        } else {
            _this.html("").slideUp(200);
        }
	},
	screenNamesInput: function(name) {
        $(".sidebar .form[name='invite'] input")
            .val(name)
            .parents(".form")
            .submit();
	}
}
