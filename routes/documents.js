/* Modules: NPM */
var rand = require("generate-key");

/* Modules: Custom */
var github = require("./github");

exports.index = function(req, res, next) {
    res.renderOutdated('documents/index', {
        title: 'Documents',
        navigation: 'Documents Drive',
        mode: "documents",
        user: req.session.user,
        js: clientJS.renderTags("documents", "header"),
        css: clientCSS.renderTags("documents", "header")
    });
};

/* Online Files */
exports.files = function(req, res, next) {
    req.models.documents_roles.find({
        user_id: req.session.user.id
    }, function(error, documents) {
        if(!error) {
            var files = [];
            $.each(documents, function(key, value) {
                if(value) {
                    files.push({
                        id: value.document_id,
                        name: value.document.name,
                        protection: (value.document.password != null) ? "password" : "",
                        location: value.document.location,
                        type: function(name) {
                            var extension = name.split(".")[name.split(".").length-1];

                            if(["png", "gif", "jpg", "jpeg", "ico", "wbm"].indexOf(extension) > -1) {
                                return "file-image";
                            } else if(["html", "jade", "ejs", "erb", "md"].indexOf(extension) > -1) {
                                return "file-template";
                            } else if(["zip", "tar", "bzip", "bzip2", "gzip", "gz"].indexOf(extension) > -1) {
                                return "file-zip";
                            } else {
                                return "file-script";
                            }
                        }(value.document.name)
                    });
                }
            });

            res.json(files);
        } else {
            res.error(200, "Failed To Load Files");
        }
    });
};

exports.file_create = function(req, res, next) {
    var path = req.param("external_path");
    req.models.documents.create({
        name: req.param("name"),
        owner_id: req.session.user.id,
        path: (path.slice(-1) == "/") ? path.slice(0, -1) : path,
        location: req.param("location")
    }, function(error, document) {
        if(!error && document) {
            res.json({document: document.id});
        } else {
            res.error(200, "Failed To Create Document");
        }
    });
};

exports.file_rename = function(req, res, next) {
    req.models.documents.get(req.param("document"), function(error, document) {
        if(!error && document) {
            document.name = req.param("name");
            res.json({ success: true });
        } else {
            res.error(200, "Failed To Rename File");
        }
    });
};

exports.file_remove = function(req, res, next) {
    req.models.documents.get(req.param("document"), function(error, document) {
        if(!error && document) {
            if(document.owner_id == req.session.user.id) {
                document.remove(function(error) {
                    if(!error) {
                        res.json({ success: true });
                    } else {
                        res.error(200, "Failed To Remove File");
                    }
                });
            } else {
                req.models.documents_roles.find({
                    user_id: req.session.user.id,
                    document_id: req.param("0")
                }).remove(function(error) {
                    if(!error) {
                        res.json({ success: true });
                    } else {
                        res.error(200, "Failed To Remove File");
                    }
                });
            }
        } else {
            res.error(200, "Failed To Remove File");
        }
    });
};

/* Locations */
exports.location = function(req, res, next) {
    if(req.session.user.locations && (req.param("0") in req.session.user.locations)) {
        switch(req.session.user.locations[req.param("0")].type) {
            case "github":
                github.contents(req, res, next);
                break;
            default:
                res.error(200, "Unknown Location Type");
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
            if(!req.session.user.github && value.type == "github") {
                return;
            }

            locations.push({
                key: key,
                name: value.name,
                type: value.type
            })
        });
        res.json(locations);
    } else {
        res.json([]);
    }
};

exports.create_location = function(req, res, next) {
    req.models.users.get(req.session.user.id, function(error, user) {
        if(!req.session.user.locations) {
            req.session.user.locations = {}
        }

        req.session.user.locations[rand.generateKey(10)] = req.param("locations_add");
        user.locations = req.session.user.locations;

        if(!error) {
            res.json({success: true});
        } else {
            res.error(200, "Failed To Create Location");
        }
    });
};

exports.remove_location = function(req, res, next) {
    if(req.session.user.locations && (req.param("locations_remove") in req.session.user.locations)) {
        req.models.users.get(req.session.user.id, function(error, user) {
            delete req.session.user.locations[req.param("locations_remove")];
            user.locations = req.session.user.locations;

            if(!error) {
                res.json({success: true});
            } else {
                res.error(200, "Failed To Remove Location");
            }
        });
    } else {
        res.error(200, "Failed To Remove Location");
    }
};
