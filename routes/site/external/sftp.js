exports.contents = function(req, res, next) {
    var location = req.session.user.locations[req.param("0")];

    req.sftp.contents(location, req.param("1"), function(error, results) {
        if(!error) {
            switch(results.type) {
                case "image":
                    res.attachment(results.name);
                    res.end(results.contents, "binary");
                    break;

                case "document":
                    path = (req.param("1").slice(-1) == "/") ? req.param("1").slice(0, -1) : req.param("1");
                    path = path.substr(0, path.lastIndexOf('/'));

                    req.models.documents.create({
                        name: results.name,
                        content: results.contents.split("\n"),
                        owner_id: req.session.user.id,
                        path: path,
                        location: req.param("0"),
                    }, function(error, document) {
                        if(!error) {
                            res.json({
                                success: true,
                                document: document.pub_id
                            });
                        } else {
                            res.error(200, "Failed To Create Document", error);
                        }
                    });
                    break;

                case "directory":
                    res.json({
                        success: true,
                        contents: $.map(results.contents, function(item) {
                            if(item){
                                item.type = function(type, extension) {
                                    if(type == "file") {
                                        if(!extension) {
                                            return "file";
                                        }  else if(["png", "gif", "jpg", "jpeg", "ico", "wbm"].indexOf(extension) > -1) {
                                            return "file-image";
                                        } else if(["html", "jade", "ejs", "erb", "md"].indexOf(extension) > -1) {
                                            return "file-template";
                                        } else if(["zip", "tar", "bz", "bz2", "gzip", "gz"].indexOf(extension) > -1) {
                                            return "file-zip";
                                        } else {
                                            return "file-script";
                                        }
                                    } else if(type == "dir") {
                                        return "folder";
                                    } else if(type == "symlink") {
                                        return "folder-symlink";
                                    } else {
                                        return type;
                                    }
                                }(item.type, item.extension);
                                return item;
                            }
                        })
                    });
                    break;
            }
        } else {
            res.error(200, "Failed To Get Contents", error);
        }
    });
}

exports.save = function(req, res, location, document) {
    req.sftp.save(
        location,
        (document.path) ? document.path + "/" + document.name : document.name,
        document.content.join("\n"),
    function(error) {
        if(!error) {
            res.json({ success: true });
        } else {
            res.error(200, "Failed To Save", error);
        }
    });
}
