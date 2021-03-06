var _this = exports;
var editorUtil = require("./editorUtil");

exports.join = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        editorUtil.accessCheck(req, function(error, response) {
            if(!error && response) {
                editorUtil.broadcast(req, "laborators");
                editorUtil.broadcast(req, "chatroom joined");

                req.io.respond(response);
            } else {
                editorUtil.error(req, error || "problems");
            }
        });
    } else if(isEmbed) {
        editorUtil.accessCheckEmbed(req, function(error, response) {
            if(!error && response) {
                req.io.respond(response);
            } else {
                editorUtil.error(req, error || "problems");
            }
        });
    } else {
        editorUtil.error(req, "kickout");
    }
}

exports.leave = function(req, override) {
    if(req.session.user && !editorUtil.isEmbed(req)) {
        editorUtil.userSockets(req, req.session.user.pub_id, function(user_sockets) {
            $.each(user_sockets, function(index, socket) {
                //Only Non-forced Disconnects
                if((req.data == "booted" && socket == req.io.socket.id) || override == true) {
                    editorUtil.broadcast(req, "chatroom left");
                }

                editorUtil.removeUser(req);
                editorUtil.broadcast(req, "laborators");
            });
        });
    }
}

exports.chatRoom = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        req.data.name = req.session.user.screen_name;
        req.data.from = req.session.user.pub_id;
        req.data.gravatar = req.session.user.gravatar;
        req.io.room(editorUtil.room(req, true)).broadcast('editorChatRoom', req.data);
    } else if(!isEmbed) {
        editorUtil.error(req, "kickout");
    }
}

exports.document = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        var room = editorUtil.room(req, true);
        req.data.from = req.session.user.pub_id;
        req.data.gravatar = req.session.user.gravatar;
        req.io.room(editorUtil.room(req, true)).broadcast('editorDocument', req.data);

        editorUtil.getRedis(room, function(error, document) {
            document.changes.push(req.data.changes);
            editorUtil.setRedis(room, document);
        });
    } else if(!isEmbed) {
        editorUtil.error(req, "kickout");
    }
}

exports.cursors = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        req.data.from = req.session.user.pub_id;
        req.data.gravatar = req.session.user.gravatar;
        req.io.room(editorUtil.room(req, true)).broadcast('editorCursors', req.data);
    } else if(!isEmbed) {
        editorUtil.error(req, "kickout");
    }
}

exports.laborators = function(req) {
    if(req.session.user || editorUtil.isEmbed(req)) {
        editorUtil.users(req, function(users) {
            req.io.respond({
                success: true,
                laborators: $.map(users, function(user) {
                    if(user.socket != req.io.socket.id) {
                        return user.pub_id;
                    }
                })
            });
        });
    } else {
        editorUtil.error(req, "kickout");
    }
}

exports.extras = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        var room = editorUtil.room(req, true);
        req.data.from = req.session.user.pub_id;
        req.data.gravatar = req.session.user.gravatar;
        req.io.room(room).broadcast('editorExtras', req.data);

        if("breakpoints" in req.data) {
            editorUtil.getRedis(room, function(error, document) {
                $.each(req.data.breakpoints, function(index, value) {
                    if(value.remove) {
                        if(document.breakpoints.indexOf(value.line) > -1) {
                            document.breakpoints.splice(document.breakpoints.indexOf(value.line), 1);
                        }
                    } else {
                        document.breakpoints.push(value.line);
                    }

                    if(req.data.breakpoints.end(index)) {
                        editorUtil.setRedis(room, document);
                    }
                });
            });
        }
    } else if(!isEmbed) {
        editorUtil.error(req, "kickout");
    }
}

exports.permission = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        var sockets = req.io.socket.manager.sockets.sockets;

        lib.models.documents.roles.find({
            user_pub_id: req.data,
            document_pub_id: editorUtil.room(req)
        }, function(error, roles) {
            if(!error && !roles.empty) {
                if(roles[0].document.owner_id == req.session.user.id) {
                    editorUtil.userSockets(req, req.data, function(user_sockets) {
                        $.each(user_sockets, function(index, socket) {
                            if(socket in sockets) {
                                if(roles[0].access) {
                                    sockets[socket].emit('editorExtras', {
                                        readonly: true
                                    });
                                } else {
                                    sockets[socket].emit('editorExtras', {
                                        docDelete: true
                                    });
                                }
                            }
                        });
                    });
                }
            }
        });
    } else if(!isEmbed) {
        editorUtil.error(req, "kickout");
    }
}

exports.save = function(req) {
    var isEmbed = editorUtil.isEmbed(req);

    if(req.session.user && !isEmbed) {
        editorUtil.saveDocument(req, function(success) {
            req.io.respond({
                success: true
            });
        });
    } else if(!isEmbed) {
        editorUtil.error(req, "kickout");
    }
}
