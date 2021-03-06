exports.index = function(req, res, next) {
    res.redirect("/documents/");
}

exports.editor = function(req, res, next) {
    req.models.documents.one({
        pub_id: req.param("document")
    }, { autoFetch: true }, function(error, document) {
        if(!error && document) {
            if(req.mobile) {
                res.redirect(req.url + "embed/");
            } else if(req.session.user) {
                document.join(req.session.user, 2, function(access, permission) {
                    if(access) {
                        res.renderOutdated('editor/code/index', {
                            title: document.name,
                            user: req.session.user,
                            document: document,
                            header: "documents",
                            js: clientJS.renderTags("backdrop", "codemirror", "editor", "aysnc", "copy", "download"),
                            css: clientCSS.renderTags("backdrop", "codemirror", "editor", "contextmenu"),
                            backdrop: req.backdrop(),
                            private: document.private,
                            config: {
                                embed: false,
                                permission: permission || {
                                    id: 2,
                                    owner: false
                                }
                            },
                            description: config.descriptions.editor.sprintf([
                                document.name,
                                document.owner.name,
                                document.name
                            ])
                        });
                    } else {
                        res.error(404);
                    }
                });
            } else if(req.param("login")) {
                res.error(401);
            } else {
                res.redirect(req.url + "embed/");
            }
        } else {
            res.error(404, null, error);
        }
    });
}

exports.embed = function(req, res, next) {
    req.models.documents.one({
        pub_id: req.param("document")
    }, { autoFetch: true }, function(error, document) {
        if(!error && document) {
            if(!document.private) {
                req.mobile = false;

                res.renderOutdated('editor/code/embed/index', {
                    title: document.name,
                    document: document,
                    js: clientJS.renderTags("backdrop", "codemirror", "editor", "aysnc"),
                    css: clientCSS.renderTags("backdrop", "codemirror", "editor", "editor-embed"),
                    embed: true,
                    header: (req.param("header") != "false"),
                    config: {
                        embed: true,
                        permission: {
                            id: 2,
                            owner: false
                        }
                    },
                    description: config.descriptions.editor.sprintf([
                        document.name,
                        document.owner.name,
                        document.name
                    ])
                });
            } else {
               res.error(404, null, null, { embed: true });
            }
        } else {
            res.error(404, null, error, { embed: true });
        }
    });
}

exports.embed_test = function(req, res, next) {
    if(!req.robot) {
        res.renderOutdated('editor/code/embed/tester', {
            title: "Embed Tester",
            document: req.param("document"),
        });
    } else {
        res.error(404);
    }
}

exports.permissions = function(req, res, next) {
    req.models.documents.permissions.all().only("name", "id").run(function(error, permissions) {
        if(!error && !permissions.empty) {
            res.json({
                success: true,
                permissions: permissions
            });
        } else {
            res.error(200, "Failed To Get Permissions", error);
        }
    });
}

exports.update = function(req, res, next) {
    req.models.documents.roles.one({
        access: true,
        user_id: req.session.user.id,
        document_pub_id: req.param("document")
    }, function(error, role) {
        if(!error) {
            if(role) {
                var user = req.session.user;
                var permission = role.permission;
                var document = role.document;
                var changeReadonly = false;
                var changePrivate = false;

                document.name = req.param("name");

                if(permission.owner) {
                    if(!user.organizations.empty) {
                        if(!user.organizations[0].permission.student) {
                            var readonly = (req.param("readonly") === "true");
                            changeReadonly = (readonly != document.readonly);
                            document.readonly = readonly;
                        }
                    }

                    if(user.pricing.documents == null || user.documents.private < user.pricing.documents) {
                        var private = (req.param("private") === "true");
                        changePrivate = (private != document.private);
                        document.private = private;
                    }
                }

                document.save(function(error, document) {
                    if(!error) {
                        res.json({
                            success: true,
                            changeReadonly: changeReadonly,
                            changePrivate: changePrivate
                        });
                    } else {
                        res.error(200, "Failed To Update File", error);
                    }
                });
            } else {
                res.error(404);
            }
        } else {
            res.error(200, "Failed To Update File", error);
        }
    });
}

exports.download = function(req, res, next) {
    req.models.documents.roles.one({
        access: true,
        user_id: req.session.user.id,
        document_pub_id: req.param("document")
    }, function(error, role) {
        if(!error) {
            if(role) {
                var document = role.document;
                res.cookie("fileDownload", true, { path: "/" });
                res.attachment(document.name);
                res.end((document.content) ? document.content.join("\n") : "", "UTF-8");
            } else {
                res.error(404);
            }
        } else {
            res.error(200, "Failed To Download File", error);
        }
    });
}

exports.remove = function(req, res, next) {
    req.models.documents.roles.one({
        user_id: req.session.user.id,
        document_pub_id: req.param("document"),
        access: true
    }, function(error, role) {
        if(!error && role) {
            var document = role.document;

            if(document.owner_id == req.session.user.id) {
                document.remove(function(error) {
                    if(!error) {
                        res.json({ success: true });
                    } else {
                        res.error(200, "Failed To Remove File", error);
                    }
                });
            } else {
                role.remove(function(error) {
                    if(!error) {
                        res.json({ success: true });
                    } else {
                        res.error(200, "Failed To Remove File", error);
                    }
                });
            }
        } else {
            res.error(200, "Failed To Remove File", error);
        }
    });
}

exports.invite = function(req, res, next) {
    req.models.documents.roles.one({
        access: true,
        user_id: req.session.user.id,
        document_pub_id: req.param("document")
    }, function(error, role) {
        if(!error) {
            if(role) {
                var document = role.document;

                req.models.users.find({
                    screen_name: req.param("screen_name").toLowerCase()
                }, function(error, users) {
                    if(!error && users.length == 1) {
                        var user = users[0];
                        document.invite(user, 2, function(success, reason) {
                            if(success) {
                                var laborators = [];
                                $.each(document.roles, function(key, role) {
                                    role.getUser(function(error, new_user) {
                                        if(req.session.user.id != new_user.id) {
                                            laborators.push({
                                                name: new_user.screen_name,
                                                gravatar: new_user.gravatar
                                            });
                                        }

                                        if(document.roles.end(key)) {
                                            req.email("document_invite", {
                                                from: req.session.user.name,
                                                replyTo: req.session.user.name + " <" + req.session.user.email + ">",
                                                subject: document.name + " (" + req.session.user.screen_name + ")",
                                                users: [{
                                                    email: user.email,
                                                    name: user.name,
                                                    document: {
                                                        from: req.session.user.screen_name,
                                                        name: document.name,
                                                        id: document.pub_id,
                                                        access: "editor",
                                                        laborators: laborators
                                                    }
                                                }]
                                            }, req.error.capture);

                                            res.json({ success: true });
                                        }
                                    });
                                });
                            } else {
                                res.error(200, reason || "Failed To Send Invite");
                            }
                        });
                    } else {
                        res.error(200, "User Doesn't Exist");
                    }
                });
            } else {
                res.error(404);
            }
        } else {
            res.error(200, "Failed To Send Invite", error);
        }
    });
}

exports.laborators = function(req, res, next) {
    req.models.documents.roles.find({
        user_id: req.db.tools.ne(req.session.user.id),
        document_pub_id: req.param("document")
    }, { autoFetch:true }, function(error, roles) {
        if(!error) {
            res.json({
                success: true,
                laborators: $.map(roles, function(role) {
                    if(role.user) {
                        return {
                            id: role.user.pub_id,
                            screen_name: role.user.screen_name,
                            gravatar: role.user.gravatar,
                            permission: {
                                id: role.permission.id,
                                access: role.permission.access,
                                owner: role.permission.owner
                            }
                        }
                    }
                }).sort(function (a, b) {
                    if(a.permission.id == b.permission.id) {
                        a = a.screen_name;
                        b = b.screen_name;
                    } else {
                        a = a.permission.id;
                        b = b.permission.id;
                    }

                    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                })
            });
        } else {
            res.error(200, "Failed To Get Laborators", error);
        }
    });
}

exports.laborator = function(req, res, next) {
    req.models.documents.roles.one({
        user_pub_id: req.param("user"),
        document_pub_id: req.param("document")
    }, function(error, role) {
        if(!error && role) {
            if(role.document.owner_id == req.session.user.id) {
                req.models.documents.permissions.get(
                    req.param("permission"), function(error, permission) {
                        if(!error && permission) {
                            role.setPermission(permission, function(error, role) {
                                if(!error) {
                                    res.json({ success: true });
                                } else {
                                    res.error(200, "Failed To Update Permission", error);
                                }
                            });
                        } else {
                            res.error(200, "Failed To Update Permission", error);
                        }
                    });
            } else {
                res.error(200, "Failed To Update Permission");
            }
        } else {
            res.error(200, "Failed To Update Permission", error);
        }
    });
}

/*
    TODO: Add Bitbucket When They
    Release an API for Committing
*/
exports.commit = function(req, res, next) {
    req.models.documents.roles.one({
        user_id: req.session.user.id,
        document_pub_id: req.param("document"),
        access: true
    }, function(error, role) {
        if(!error && role) {
            if(!role.permission.readonly) {
                var document = role.document;
                var location = req.session.user.locations[document.location];

                if(location) {
                    if(!document.content.empty) {
                        switch(location.type) {
                            case (!config.apps.github || "github"):
                                req.routes.external.github.commit(req, res, location, document);
                                break;
                            /*
                            case (!config.apps.bitbucket || "bitbucket"):
                                req.routes.external.bitbucket.contents(req, res, next);
                                break;
                            */
                            default:
                                res.error(200, "Failed To Commit");
                                break;
                        }
                    } else {
                        res.error(200, "Failed To Commit");
                    }
                } else {
                    res.error(200, "Failed To Commit");
                }
            } else {
                res.error(200, "Failed To Commit", error);
            }
        } else {
            res.error(200, "Failed To Commit", error);
        }
    });
}

exports.save = function(req, res, next) {
    req.models.documents.roles.one({
        user_id: req.session.user.id,
        document_pub_id: req.param("document"),
        access: true
    }, function(error, role) {
        if(!error && role) {
            if(!role.permission.readonly) {
                var document = role.document;
                var location = req.session.user.locations[document.location];

                if(location) {
                    if(!document.content.empty) {
                        switch(location.type) {
                            case (!config.apps.sftp || "sftp"):
                                req.routes.external.sftp.save(req, res, location, document);
                                break;
                            default:
                                res.error(200, "Failed To Save");
                                break;
                        }
                    } else {
                        res.error(200, "Failed To Save");
                    }
                } else {
                    res.error(200, "Failed To Save");
                }
            } else {
                res.error(200, "Failed To Save", error);
            }
        } else {
            res.error(200, "Failed To Save", error);
        }
    });
}
