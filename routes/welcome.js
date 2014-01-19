var async = require("async");
var pages = ["index", "creative", "social", "explore"];

exports.index = function(req, res) {
    res.renderOutdated('welcome/index', {
        title: 'Welcome',
        user: req.session.user,
        js: clientJS.renderTags("backdrop", "welcome"),
        css: clientCSS.renderTags("backdrop", "welcome"),
        backdrop: req.backdrop(),
        pageTrack: true
    });
};


exports.creative = function(req, res) {
    res.renderOutdated('welcome/creative', {
        title: 'Welcome',
        user: req.session.user,
        js: clientJS.renderTags("backdrop", "welcome", "codemirror"),
        css: clientCSS.renderTags("backdrop", "welcome", "codemirror"),
        backdrop: req.backdrop(),
        pageTrack: true
    });
};

exports.social = function(req, res) {
    var laborators = [];

    req.models.users.all({
        id: req.db.tools.ne(req.session.user.id)
    }, ["created", "Z"], 10, function(error, users) {
        if(!error) {
            async.each(users, function(user, callback) {
                req.models.documents.roles.find({
                    user_id: user.id
                }, ["viewed"], 60, ["created", "A"], function(error, roles) {
                    user.documents = $.map(roles, function(role) {
                        return role.viewed;
                    });

                    laborators.push(user);
                    callback(null);
                });
            }, function() {
                res.renderOutdated('welcome/social', {
                    title: 'Welcome',
                    users: laborators,
                    js: clientJS.renderTags("backdrop", "welcome"),
                    css: clientCSS.renderTags("backdrop", "welcome"),
                    backdrop: req.backdrop(),
                    pageTrack: true
                });
            });
        } else {
            res.error(404, null, error);
        }
    });
};

exports.laborator = function(req, res) {
    req.models.documents.all({}, {
        autoFetch:true,
        autoFetchLimit: 3
    }, 10, ["viewed", "Z"], function (error, documents) {
        if(!error) {
            res.renderOutdated('welcome/laborator', {
                title: 'Welcome',
                documents: documents,
                js: clientJS.renderTags("welcome", "explore", "backdrop"),
                css: clientCSS.renderTags("welcome", "backdrop"),
                backdrop: req.backdrop(),
                pageTrack: true
            });
        } else {
            res.error(404, null, error);
        }
    });
};
