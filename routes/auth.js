/* Modules: NPM */
var $ = require('jquery');
var crypto = require('crypto');
var async = require("async");
var uuid = require('node-uuid');
var rand = require("generate-key");

/* Modules: Custom */
var core = require('./core');
var aes = require('../lib/core/aes');

/* Module Exports: Access Checks */
exports.restrictAccess = function(req, res, next) {
    if(req.session.user) {
        if(config.cookies.rememberme in req.cookies) {
            if(req.session.user.verified && req.url.indexOf("verify") == -1) {
                res.redirect("/verify/");
            } else {
                if(next) next();
            }
        } else {
            req.models.users.get(req.session.user.id, function(error, user) {
                if(!error && user) {
                    user.set_recovery(req, res);
                    if(next) next();
                } else {
                    res.error(401);
                }
            });
        }
    } else {
        if(config.cookies.rememberme in req.cookies) {
            req.models.users.find({recovery: req.cookies[config.cookies.rememberme]},
                function(error, user) {
                    if(!error && user.length == 1) {
                        user[0].set_recovery(req, res);
                        req.session.user = user[0];
                        req.session.save();
                        if(next) next();
                    } else {
                        res.error(401);
                    }
            });
        } else {
            res.error(401);
        }
    }
};

exports.loginCheck = function(req, res, next) {
    if(req.session.user) {
        if(req.session.redirect_url) {
            res.redirect(req.session.redirect_url);
            delete req.session.redirect_url;
            req.session.save();
        } else {
            res.redirect('/documents/');
        }
    } else {
        if(config.cookies.rememberme in req.cookies) {
            req.models.users.find({recovery: req.cookies[config.cookies.rememberme]},
                function(error, user) {
                    if(!error && user.length == 1) {
                        user[0].set_recovery(req, res);
                        req.session.user = user[0];
                        if(req.session.redirect_url) {
                            res.redirect(req.session.redirect_url);
                            delete req.session.redirect_url;
                            req.session.save();
                        } else {
                            res.redirect('/documents/');
                        }
                    } else {
                        if(next) next();
                    }
            });
        } else {
            if(next) next();
        }
    }
};

exports.xhr = function(req, res, next) {
    if(req.xhr) {
        next();
    } else {
        res.redirect("/documents/");
    }
}

/* Module Exports: Access Operations */
exports.login = function(req, res, next) {
    req.models.users.find({
        email: $.trim(req.param('email')),
        password: req.models.users.hash($.trim(req.param('password')))
    }, function(error, users) {
        if(!error && users.length == 1) {
            users[0].set_recovery(req, res);
            req.session.user = users[0];

            if(req.session.redirect_url) {
                var url = req.session.redirect_url;
                delete req.session.redirect_url;
            } else {
                var url = '/documents/';
            }
            req.session.save();
            res.json({
                success: true,
                next: url
             });
        } else {
            res.error(200, "Incorrect Email or Password");
        }

    });
}

exports.logout = function(req, res) {
    req.session.user = null;
    req.session.save();
    res.clearCookie(config.cookies.rememberme, {
        domain: req.host.replace(/^[^.]+\./g, "")
    });
    res.redirect('/');
};

exports.register = function(req, res, next) {
    req.models.users.exists({email: req.param('email')}, function(error, exists) {
        if(error || exists) {
            res.error(200, "Email Already Exists");
        } else if(req.param('password') != req.param('password_confirm')) {
            res.error(200, "Passwords Do Not Match");
        } else {
            req.models.users.create({
                name: $.trim(req.param('name')),
                screen_name: $.trim(req.param('screen_name')),
                email: $.trim(req.param('email')),
                password: $.trim(req.param('password'))
            }, function(error, user) {
                if(!error) {
                    user.set_recovery(req, res);
                    req.session.user = user;
                    req.session.save();
                    res.json({
                        success: true,
                        next: "/verify/"
                    });

                    req.email("verify", {
                        from: "support@laborate.io",
                        subject: "Please Verify Your Email",
                        users: [{
                            name: user.name,
                            email: user.email,
                            code: user.verified
                        }]
                    });
                } else {
                    res.error(200, "Please Enter A Valid Email");
                }
            });
        }
    });
};

exports.verify = function(req, res, next) {
    if(!req.session.user.verified) {
        res.redirect('/documents/');
    } else if($.trim(req.param('code')) != req.session.user.verified) {
        res.error(401);
    } else {
        req.models.users.get(req.session.user.id, function(error, user) {
            user.verified = null;
            req.session.user = user;
            if(req.session.redirect_url) {
                var url = req.session.redirect_url;
                delete req.session.redirect_url;
            } else {
                var url = '/documents/';
            }
            req.session.save();
            res.redirect(url);
        });
    }
};
