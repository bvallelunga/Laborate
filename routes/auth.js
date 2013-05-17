/* Modules: NPM */
var crypto = require('crypto');
var async = require("async");

/* Modules: Custom */
var aes   = require('../lib/aes');
var mysql_lib = require('../lib/users_mysql_lib');

/* Module Exports */
exports.login = function(req, res) {
    async.parallel({
        user: function(callback) {
            mysql_lib.user_by_email(callback, req.param('user_email'));
        }
    }, function(error, results){
        user = results.user[0];

        if(!error && user) {
            if(aes.decrypt(user['user_password'], req.param('user_password')) == req.param('user_password')) {
                req.session.user = {
                    id: user["user_id"],
                    name: user["user_name"],
                    screen_name: user["user_screen_name"],
                    email: user["user_email"],
                    email_hash: crypto.createHash('md5').update(user["user_email"]).digest("hex"),
                    pricing_id: user["user_pricing"],
                    pricing_documents: user["pricing_documents"],
                    github: user["user_github"]
                };

                res.json({"success": true});
            } else {
                res.json({
                    "success": false,
                    "error_message": "Incorrect Email or Password"
                });
            }
        } else {
           res.json({
                "success": false,
                "error_message": "Incorrect Email or Password"
            });
        }
    });
};

exports.logout = function(req, res) {
    req.session = null;
    res.redirect('/');
};

exports.register = function(req, res) {
    req.session.user = "6";
    res.json({"success": true});
};

exports.emailCheck = function(req, res) {
    if(req.param('user_email') != "1") {
        res.json({"success": true});
    } else {
        res.json({
            "success": false,
            "error_message": "Email Already Exists"
        });
    }
};

exports.restrictAccess = function(req, res, next) {
    if(req.session.user) {
        async.parallel({
            userCount: function(callback) {
                mysql_lib.user_by_id_count(callback, req.session.user.id);
            }
        }, function(error, results){
            if(!error, results.userCount) {
                next();
            } else {
                res.redirect('/logout/');
            }
        });
    } else {
        res.redirect('/logout/');
    }
};

exports.loginCheck = function(req, res, next) {
    if(req.session.user) {
        res.redirect('/documents/');
    } else {
        next();
    }
};