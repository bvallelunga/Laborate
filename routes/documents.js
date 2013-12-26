/* Modules: NPM */
var fs = require('fs');
var rand = require("generate-key");

/* Modules: Custom */
var github = require("./github");
var bitbucket = require("./bitbucket");
var google = require("./google");

exports.index = function(req, res, next) {
    res.renderOutdated('documents/index', {
        title: 'Documents',
        js: clientJS.renderTags("documents", "download"),
        css: clientCSS.renderTags("documents")
    });
};

/* Online Files */
exports.files = function(req, res, next) {
    req.models.documents.roles.find({
        user_id: req.session.user.id,
        access: true
    }, function(error, documents) {
        if(!error) {
            res.json($.map(documents, function(value) {
                if(value) {
                    return {
                        id: value.document.pub_id,
                        name: value.document.name,
                        private: value.document.private,
                        location: value.document.location,
                        size: value.document.size(),
                        type: function(name) {
                            var extension = name.split(".")[name.split(".").length-1];

                            if(!extension) {
                                return "file";
                            } else if(["png", "gif", "jpg", "jpeg", "ico", "wbm"].indexOf(extension) > -1) {
                                return "file-image";
                            } else if(["html", "jade", "ejs", "erb", "md"].indexOf(extension) > -1) {
                                return "file-template";
                            } else if(["zip", "tar", "bz", "bz2", "gzip", "gz"].indexOf(extension) > -1) {
                                return "file-zip";
                            } else {
                                return "file-script";
                            }
                        }(value.document.name),
                        users: (value.document.roles.length - 1),
                        role: value.permission.name.toLowerCase()
                    }
                }
            }));
        } else {
            res.error(200, "Failed To Load Files", error);
        }
    });
};

exports.file_create = function(req, res, next) {
    req.models.documents.create({
        name: req.param("name"),
        owner_id: req.session.user.id,
    }, function(error, document) {
        if(!error && document) {
            res.json({
                success: true,
                documents: [{
                    id: document.pub_id,
                    name: document.name,
                    size: document.size(),
                    type: function(name) {
                        var extension = name.split(".")[name.split(".").length-1];

                        if(["png", "gif", "jpg", "jpeg", "ico", "wbm"].indexOf(extension) > -1) {
                            return "file-image";
                        } else if(["html", "jade", "ejs", "erb", "md"].indexOf(extension) > -1) {
                            return "file-template";
                        } else if(["zip", "tar", "bz", "bz2", "gzip", "gz"].indexOf(extension) > -1) {
                            return "file-zip";
                        } else {
                            return "file-script";
                        }
                    }(document.name),
                    role: "owner"
                }]
            });
        } else {
            res.error(200, "Failed To Create Document", error);
        }
    });
};

exports.file_upload = function(req, res, next) {
    if(req.files) {
        // Make sure it is a list
        if(!(req.files.files instanceof Array)) {
            req.files.files = [req.files.files];
        }

        var file_length = req.files.files.length;
        var response = {
            success: true,
            documents: []
        };
        var timer = setInterval(function() {
            if(file_length == response.documents.length) {
                clearInterval(timer);
                res.json(response);
            }
        }, 50);

        $.each(req.files.files, function(i, file) {
            // Type Casting and 1mb limit
            if(!((file.type == "" || file.type.match(/(?:text|json|octet-stream)/)) && file.size < 1024 * 2000)) {
                file_length -= 1;
                return true;
            }

            req.models.documents.create({
                name: file.name,
                owner_id: req.session.user.id,
                content: fs.readFileSync(file.path, 'utf8').split("\n")
            }, function(error, document) {
                if(!error && document) {
                    fs.unlink(file.path);

                    response.documents.push({
                        id: document.pub_id,
                        name: document.name,
                        size: document.size(),
                        type: function(name) {
                            var extension = name.split(".")[name.split(".").length-1];

                            if(["png", "gif", "jpg", "jpeg", "ico", "wbm"].indexOf(extension) > -1) {
                                return "file-image";
                            } else if(["html", "jade", "ejs", "erb", "md"].indexOf(extension) > -1) {
                                return "file-template";
                            } else if(["zip", "tar", "bz", "bz2", "gzip", "gz"].indexOf(extension) > -1) {
                                return "file-zip";
                            } else {
                                return "file-script";
                            }
                        }(document.name),
                        role: "owner"
                    });
                } else {
                    res.error(200, "Failed To Upload Files", error);
                }
            });
        });
    } else {
        res.error(200, "Failed To Upload Files");
    }
}

exports.file_rename = function(req, res, next) {
    req.models.documents.roles.find({
        user_id: req.session.user.id,
        document_pub_id: req.param("document"),
        access: true
    }, function(error, documents) {
        if(!error && documents.length == 1) {
            document = documents[0].document;
            document.save({ name: req.param("name") });
            res.json({
                success: true,
                document: {
                    id: document.pub_id,
                    name: document.name,
                    type: function(name) {
                        var extension = name.split(".")[name.split(".").length-1];

                        if(!extension) {
                            return "file";
                        } else if(["png", "gif", "jpg", "jpeg", "ico", "wbm"].indexOf(extension) > -1) {
                            return "file-image";
                        } else if(["html", "jade", "ejs", "erb", "md"].indexOf(extension) > -1) {
                            return "file-template";
                        } else if(["zip", "tar", "bz", "bz2", "gzip", "gz"].indexOf(extension) > -1) {
                            return "file-zip";
                        } else {
                            return "file-script";
                        }
                    }(document.name)
                }
             });
        } else {
            res.error(200, "Failed To Rename File", error);
        }
    });
};

exports.file_remove = function(req, res, next) {
     req.models.documents.roles.find({
        user_id: req.session.user.id,
        document_pub_id: req.param("document"),
        access: true
    }, function(error, documents) {
        if(!error && documents.length == 1) {
            document = documents[0].document;
            if(document.owner_id == req.session.user.id) {
                document.remove(function(error) {
                    if(!error) {
                        res.json({ success: true });
                    } else {
                        res.error(200, "Failed To Remove File", error);
                    }
                });
            } else {
                documents[0].remove(function(error) {
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
};

/* Locations */
exports.location = function(req, res, next) {
    if(req.param("0") in req.session.user.locations) {
        switch(req.session.user.locations[req.param("0")].type) {
            case (!config.apps.github || "github"):
                github.contents(req, res, next);
                break;
            case (!config.apps.bitbucket || "bitbucket"):
                bitbucket.contents(req, res, next);
                break;
            case (!config.apps.google || "google"):
                google.contents(req, res, next);
                break;
            default:
                res.error(200, "Location Does Not Exist");
                break;
        }
    } else {
        res.error(200, "Location Does Not Exist");
    }
};

exports.locations = function(req, res, next) {
    if(req.session.user.locations) {
        locations = [];
        $.each(req.session.user.locations, function(key, value) {
            switch(value.type) {
                case ((config.apps.github && req.session.user.github) || "github"):
                    return;
                case ((config.apps.bitbucket && !$.isEmptyObject(req.session.user.bitbucket)) || "bitbucket"):
                    return;
                case ((config.apps.google && !$.isEmptyObject(req.session.user.google)) || "google"):
                    return;
                default:
                    locations.push({
                        key: key,
                        name: value.name,
                        type: value.type
                    });
                    break;
            }
        });
        res.json(locations);
    } else {
        res.json([]);
    }
};

exports.create_location = function(req, res, next) {
    req.models.users.get(req.session.user.id, function(error, user) {
        if(!error) {
            var key = rand.generateKey(Math.floor(Math.random() * 15) + 15);
            user.locations[key] = req.param("location");

            // JSON.cycle is a patch til I figure out why the orm
            // was not saving the changed locations object
            user.save({ locations: JSON.cycle(user.locations) }, function(error, user) {
                if(!error) {
                    req.session.user = user;
                    req.session.save();
                    res.json({ success: true });
                } else {
                    res.error(200, "Failed To Create Location", error);
                }
            });
        } else {
            res.error(200, "Failed To Create Location", error);
        }
    });
};