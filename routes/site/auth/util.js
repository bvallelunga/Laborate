/* Checks */
exports.restrictAccess = function(req, res, next) {
    if(req.session.user) {
        if(config.cookies.rememberme in req.cookies) {
            if(req.session.user.verify && !(/^\/verify/.exec(req.url))) {
                    res.redirect("/verify/");
            } else {
                if(next) next();
            }
        } else {
            req.models.users.get(req.session.user.id, function(error, user) {
                if(!error && user) {
                    user.set_recovery(req, res);
                    if(req.session.user.verify && !(/^\/verify/.exec(req.url))) {
                            res.redirect("/verify/");
                    } else if(next) {
                        next();
                    }
                } else {
                    res.error(401, false, error);
                }
            });
        }
    } else {
        if(req.robot) {
            $.each(config.robots, function(key, url) {
                if(req.url.indexOf(url) != -1) {
                    res.error(404);
                    return false;
                }

                if(config.robots.end(key)) next();
            });
        } else {
            if(config.cookies.rememberme in req.cookies) {
                req.models.users.one({
                    recovery: req.cookies[config.cookies.rememberme]
                }, function(error, user) {
                    if(!error && user) {
                        user.set_recovery(req, res);
                        req.session.user = user;
                        req.session.save();
                        res.redirect(req.originalUrl);
                    } else {
                        res.error(401, false, error);
                    }
                });
            } else {
                res.error(401);
            }
        }
    }
};

exports.loginGenerate = function(req, res, next) {
    if(!req.session.user) {
        if(config.cookies.rememberme in req.cookies) {
            req.models.users.one({
                recovery: req.cookies[config.cookies.rememberme]
            }, function(error, user) {
                if(!error && user) {
                    user.set_recovery(req, res);
                    req.session.user = user;
                }

                next();
            });
        } else {
            next();
        }
    } else {
        next();
    }

}

exports.loginCheck = function(req, res, next) {
    if(req.session.user) {
        res.redirect(config.general.default);
    } else {
        if(config.cookies.rememberme in req.cookies) {
            req.models.users.one({
                recovery: req.cookies[config.cookies.rememberme]
            }, function(error, user) {
                if(!error && user) {
                    user.set_recovery(req, res);
                    req.session.user = user;
                    res.redirect(config.general.default);
                } else if(next) {
                    next();
                }
            });
        } else {
            if(next) next();
        }
    }
};

exports.removeRedirect = function(req, res, next) {
    delete req.session.redirect_url;
    req.session.save();
    next();
}

exports.robotDenied = function(req, res, next) {
    if(req.robot && !req.session.user) {
        res.error(404);
    } else {
        next();
    }
}

exports.loginDenied = function(req, res, next) {
    if(req.session.user) {
        res.error(404);
    } else {
        next();
    }
}

exports.admin = function(req, res, next) {
    if(req.session.user) {
        if(req.session.user.admin) {
            next();
        } else {
            res.error(404);
        }
    } else {
        res.error(404);
    }
}

exports.xhr = function(req, res, next) {
    if(req.xhr) {
        next();
    } else {
        res.redirect(config.general.default);
    }
}

/* Operations */
exports.login = function(req, res, next) {
    var name = $.trim(req.param('name'));
    var password = req.models.users.hash($.trim(req.param('password')));

    req.models.users.one({
        or: [
            {
                email: name,
                password: password
            },
            {
                screen_name: name,
                password: password
            }
        ]
    }, function(error, user) {
        if(!error && user) {
            user.has_organization(req.session.organization.id, function(has_organization) {
                if(has_organization) {
                    if(user.admin && $.isEmptyObject(user.stripe)) {
                        user.set_recovery(req, res);
                        user.verified(function(user) {
                            req.session.user = user;
                            res.json({
                                success: true,
                                next: req.session.redirect_url || config.general.default
                             });
                             delete req.session.reset;
                             delete req.session.redirect_url;
                             req.session.save();
                        });
                    } else {
                        req.session.user = user;
                        res.json({
                            success: true,
                            next: req.session.redirect_url || config.general.default
                        });
                        delete req.session.redirect_url;
                        req.session.save();
                    }
                } else {
                    res.error(200, "Invalid Credentials");
                }
            });
        } else {
            res.error(200, "Invalid Credentials", error);
        }
    });
}

exports.logout = function(req, res) {
    delete req.session.user;
    delete req.session.last_page;
    delete req.session.reset;
    req.session.save();

    res.clearCookie(config.cookies.rememberme);

    if(req.session.redirect_url) {
        res.redirect('/login/');
    } else {
        res.redirect('/');
    }
};

exports.register = function(req, res, next) {
    req.models.users.exists({
        email: req.param('email')
    }, function(error, exists) {
        if(error || exists) {
            res.error(200, "Email Already Exists", error);
        } else {
            req.models.users.exists({
                screen_name: req.param('screen_name')
            }, function(error, exists) {
                if(!error) {
                    if(exists) {
                        res.error(200, "Screen Name Already Exists");
                    } else if(req.param('screen_name').length <= 2) {
                        res.error(200, "Screen Name Is To Short");
                    } else if(req.param('screen_name').length > 30) {
                        res.error(200, "Screen Name Is To Long");
                    } else if(req.param('screen_name').indexOf(" ") != -1) {
                        res.error(200, "Screen Name Has Spaces");
                    } else if(req.param('password').length <= 6) {
                        res.error(200, "Password Is To Short");
                    } else if(req.param('password') != req.param('password_confirm')) {
                        res.error(200, "Passwords Do Not Match");
                    } else {
                        req.models.users.create({
                            name: $.trim(req.param('name')),
                            screen_name: $.trim(req.param('screen_name')).toLowerCase(),
                            email: $.trim(req.param('email')),
                            password: $.trim(req.param('password')),
                            pricing_id: 1
                        }, function(error, user) {
                            if(!error) {
                                if(req.session.organization.id) {
                                    user.add_organization(req.session.organization.id);
                                }

                                user.set_recovery(req, res);
                                req.session.user = user;
                                req.session.save();
                                res.json({
                                    success: true,
                                    next: "/verify/"
                                });

                                req.email("verify", {
                                    subject: "Please Verify Your Email",
                                    users: [{
                                        name: user.name,
                                        email: user.email,
                                        code: user.verify
                                    }]
                                }, req.error.capture);
                            } else {
                                res.error(200, "Invalid Email Address", error);
                            }
                        });
                    }
                } else {
                    res.error(200, "Failed To Register", error);
                }
            });
        }
    });
};

exports.verify = function(req, res, next) {
    if(!req.session.user.verify) {
        res.redirect(config.general.default);
    } else if($.trim(req.param('code')) != req.session.user.verify) {
        res.error(402);
    } else {
        req.models.users.get(req.session.user.id, function(error, user) {
            user.verified(function(user) {
                req.session.user = user;
                res.redirect("/welcome/");
                delete req.session.redirect_url;
                req.session.save();
            });
        });
    }
};

exports.verifyResend = function(req, res, next) {
    if(!req.session.user.verify) {
        res.redirect(config.general.default);
    } else {
        req.models.users.get(req.session.user.id, function(error, user) {
            if(!error) {
                user.set_verify();
                req.email("verify", {
                    subject: "Please Verify Your Email",
                    users: [{
                        name: user.name,
                        email: user.email,
                        code: user.verify
                    }]
                }, req.error.capture);

                req.session.user = user;
                req.session.save();

                res.redirect("/verify/");
            } else {
                res.error(404, null, error);
            }
        });
    }
};

exports.reload = function(req, res, next) {
  if(req.session.user) {
        req.models.users.get(req.session.user.id, function(error, user) {
            if(!error && user) {
                user.set_recovery(req, res);
                req.session.user = user;
                res.redirect(req.session.last_page || config.general.default);
                delete req.session.reset;
                delete req.session.last_page;
                req.session.save();
            } else {
                res.redirect('/logout/');
            }
        });
    } else {
        res.redirect('/logout/');
    }
}

exports.reset = function(req, res, next) {
    req.models.users.one({
        email: req.param("email")
    }, function(error, user) {
        if(!error && user) {
            user.has_organization(req.session.organization.id, function(has_organization) {
                if(has_organization) {
                    user.set_reset();

                    req.session.reset = true;
                    req.session.save();

                    res.json({
                        success: true,
                        next: "/reset"
                    });

                    req.email("reset", {
                        subject: "Reset Password Link",
                        users: [{
                            name: user.name,
                            email: user.email,
                            code: user.reset
                        }]
                    }, req.error.capture);
                } else {
                    res.error(200, "Email Address Not Found");
                }
            });
        } else {
            res.error(200, "Email Address Not Found", error);
        }
    });

}

exports.reset_password = function(req, res, next) {
    req.models.users.one({
        reset: req.param("code")
    }, function(error, user) {
        if(!error && user) {
            if($.trim(req.param("password")) != $.trim(req.param("password_confirm"))) {
                res.error(200, "Passwords Do Not Match");
            } else if($.trim(req.param('password')).length <= 6) {
                res.error(200, "Password Is To Short");
            } else {

                user.save({
                    reset: null,
                    password: user.hash($.trim(req.param('password')))
                }, function(error, user) {
                    if(!error) {
                        req.session.user = user;
                        delete req.session.reset;
                        req.session.save();

                        res.json({
                            success: true,
                            next: "/"
                        });
                    } else {
                        res.error(200, "Failed To Reset Password", error);
                    }
                });
            }
        } else {
            res.error(200, "Failed To Reset Password", error);
        }
    });
}

exports.refer = function(req, res, next) {
    $.each(req.param("email").split(","), function(index, email) {
        email = $.trim(email);

        if(/.*?@.*/.test(email)) {
            req.models.users.exists({
                email: email
            }, function(error, exists) {
                if(!error && !exists) {
                    req.email("refer", {
                        from: req.session.user.name.capitalize,
                        replyTo: req.session.user.name + " <" + req.session.user.email + ">",
                        subject: "From a " + req.session.user.name.capitalize + " at Laborate",
                        users: [{
                            email: email,
                            name: req.session.user.name.capitalize,
                            screen_name: req.session.user.screen_name
                        }]
                    }, req.error.capture);
                } else {
                    req.error.capture(error);
                }
            });
        }
    });

    res.json({
        success: true
    });
}
