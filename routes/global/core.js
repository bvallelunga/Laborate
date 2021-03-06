var fs = require("fs");
var outdatedhtml = require('express-outdatedhtml');
var backdrop_themes = {};

exports.setup = function(req, res, next) {
    //Set Server Root For Non Express Calls
    req.session.server = req.protocol + "://" + req.host;
    req.verified = (req.host.split(".").slice(-2).join(".") == config.general.security);

    if(!config.general.production || !config.random) {
        config.random = Math.floor((Math.random()*1000000)+1);
    }

    //Header Config
    res.header("Server", config.general.company);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.host);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');

    //Replace Views Elements For Compatibility With IE
    res.renderOutdated = function(view, data) {
        if(req.mobile) {
            res.render('landing/mobile', {
                title: "",
                js: clientJS.renderTags("mobile"),
                css: clientCSS.renderTags("backdrop", "mobile"),
                backdrop: req.backdrop(),
                pageTrack: false,
                config: {
                    animate: false
                }
            }, outdatedhtml.makeoutdated(req, res));
        } else {
            res.render(view, data, outdatedhtml.makeoutdated(req, res));
        }
    }

    req.address = {
        ip: req.headers['x-forwarded-for'] || req.ip,
        port: req.headers['x-forwarded-port'] || function(ssl) {
            if(ssl) {
                return config.general.ports.https;
            } else {
                return config.general.ports.http;
            }
        }(config.general.ssl)
    }

    req.session.save();
    next();
}

exports.redirects = function(req, res, next) {
    if(req.subdomains.indexOf('www') === -1) {
        next();
    } else {
        res.redirect(req.protocol + "://" + req.host.split(".").slice(1).join(".") + req.path);
    }
}

exports.imports = function(req, res, next) {
    //Import Lib
    req.core = lib.core;
    req.bitbucket = lib.bitbucket;
    req.email = lib.email(req.session.server);
    req.email_test = lib.email_test(req.session.server);
    req.email_init = lib.email_init;
    req.github = lib.github;
    req.google = lib.google;
    req.jsdom = lib.jsdom;
    req.sftp = lib.sftp;
    req.stripe = lib.stripe;
    req.redis = lib.redis;
    req.redis_init = lib.redis_init;
    req.error = lib.error;
    req.geoip = lib.geoip;
    req.sitemap = lib.sitemap;
    req.markdown = lib.markdown(req.session.server);
    req.markdown_links = lib.markdown_links;
    req.location = lib.geoip(req.address.ip) || {
        city: null,
        region: null,
        country: null,
        ll: [null, null]
    };
    req.fake = {
        user: {
            id: null,
            name: "An Amazaing Laborator",
            screen_name: "laborator",
            gravatar: config.gravatar,
            fake: true,
            groups: [],
            organizations: []
        },
        organization: {
            fake: true,
            register: true,
            logos: {}
        }
    };

    //Device Info
    var device = req.device.type.toLowerCase();
    req.mobile = ["phone", "tablet"].indexOf(device) != -1;
    req.robot = (device == "bot");
    req.tv = (device == "tv");

    //Backdrop
    if(!req.xhr) {
        req.backdrop = function(theme) {
            if(!theme) {
                if(req.session.organization.theme) {
                    theme = req.session.organization.theme;
                } else if(req.location.city) {
                    theme = req.location.city.toLowerCase().replace(/ /g, '_');
                } else {
                    theme = config.general.backdrop;
                }
            }

            if($.isEmptyObject(backdrop_themes)) {
                var themes = __dirname + "/../../public/img/backgrounds/";

                $.each(fs.readdirSync(themes), function(index, theme) {
                    var theme_path = themes + "/" + theme;
                    var stats = fs.lstatSync(theme_path);

                    if(stats.isDirectory() || stats.isSymbolicLink()) {
                        var files = fs.readdirSync(theme_path);

                        if(!files.empty) {
                            backdrop_themes[theme] = files;
                        }
                    }
                });
            }

            if(theme in backdrop_themes) {
                var file = backdrop_themes[theme][Math.floor((Math.random() * backdrop_themes[theme].length))];
                return "background-image: url('/img/backgrounds/" + theme + "/" + file + "');".replace(/ /g, '');
            } else {
                return req.backdrop(config.general.backdrop);
            }
        }
    }

    //Api Routes
    if(req.subdomains.indexOf("api") != -1) {
        require("../api/routes")(function(routes) {
            req.routes = routes;
        });

    //Webhooks Routes
    } else if(req.subdomains.indexOf("webhook") != -1) {
        require("../webhooks/routes")(function(routes) {
            req.routes = routes;
        });

    //Site Routes
    } else {
        require("../site/routes")(function(routes) {
            req.routes = routes;
        });
    }

    //Tracking
    var user = (req.session) ? (req.session.user || {}) : {};

    if(!user.admin) {
        req.redis.get("tracking", function(error, data) {
            var tracking = (data) ? JSON.parse(data) : [];
            var organization = req.session.organization;

            tracking.push({
                agent: req.headers['user-agent'],
                lat: req.location.ll[0],
                lon: req.location.ll[1],
                city: req.location.city,
                state: req.location.region,
                country: req.location.country,
                ip: req.address.ip,
                port: req.address.port,
                user_id: (user) ? user.id : null,
                organization_id: (organization) ? organization.id : null,
                url: req.protocol + "://" + req.get('host') + req.url,
                type: function(req) {
                    if(
                        req.robot ||
                        !req.headers['user-agent'] ||
                        req.headers['user-agent'].indexOf("bot") != -1
                    ) {
                        return "bot";
                    } else if(req.mobile) {
                        return "mobile";
                    } else if(req.tv) {
                        type = "tv";
                    } else if(req.xhr) {
                        return "xhr";
                    } else {
                        return "web";
                    }
                }(req)
            });

            req.redis.set(
                "tracking",
                JSON.stringify(tracking),
                req.error.capture
            );
        });
    }

    //Import Models
    lib.models_express(req, res, next);
}

exports.locals = function(req, res, next) {
    res.locals.csrf = (req.csrfToken) ? req.csrfToken() : "";
    res.locals.port = config.general.port;
    res.locals.production = config.general.production;
    res.locals.host = req.session.server;
    res.locals.url = req.url;
    res.locals.socket = req.session.server;
    res.locals.site_title = req.session.organization.logo || config.general.company;
    res.locals.site_delimeter = config.general.delimeter.web;
    res.locals.description = config.general.description.join("");
    res.locals.sentry = config.sentry.browser;
    res.locals.google = config.google;
    res.locals.company = config.general.company;
    res.locals.logo = req.session.organization.logo || config.general.logo;
    res.locals.social = config.social;
    res.locals.backdrop = "";
    res.locals.private = false;
    res.locals.pageTrack = true;
    res.locals.config = {};
    res.locals.icons = config.icons;
    res.locals.user = req.session.user || req.fake.user;
    res.locals.organization = req.session.organization;
    res.locals.gravatar = (req.session.user) ? req.session.user.gravatar : config.gravatar;
    res.locals.mobile = req.mobile;
    res.locals.robot = req.robot;
    res.locals.title_first = true;
    res.locals.hiring = config.general.hiring;
    res.locals.random = "?rand=" + config.random;
    res.locals.embed = false;
    res.locals.header = "";
    res.locals.header_class = "";
    res.locals.type = "website";

    res.locals.apps = {
        sftp: {
            show: config.apps.sftp
        },
        github: {
            show: config.apps.github,
            enabled: !!(req.session.user && req.session.user.github),
            link: "/github/token/"
        },
        bitbucket: {
            show: config.apps.bitbucket,
            enabled: !$.isEmptyObject(req.session.user && req.session.user.bitbucket),
            link: "/bitbucket/token/"
        },
        dropbox: {
            show: config.apps.dropbox,
            enabled: false,
            link: "/dropbox/token/"
        },
        google: {
            show: config.apps.google,
            enabled: false,
            link: "/google/token/"
        }
    };
    res.locals.logos = {
        "logo":  req.session.organization.logos["logo"]  || res.locals.host + "/img/logo.png",
        "graph": req.session.organization.logos["graph"] || res.locals.host + "/favicon/196.png",
        "1000":  req.session.organization.logos["1000"]  || res.locals.host + "/favicon/1000.png",
        "500":   req.session.organization.logos["500"]   || res.locals.host + "/favicon/500.png",
        "196":   req.session.organization.logos["196"]   || res.locals.host + "/favicon/196.png",
        "160":   req.session.organization.logos["160"]   || res.locals.host + "/favicon/160.png",
        "114":   req.session.organization.logos["114"]   || res.locals.host + "/favicon/114.png",
        "72":    req.session.organization.logos["72"]    || res.locals.host + "/favicon/72.png",
        "57":    req.session.organization.logos["57"]    || res.locals.host + "/favicon/57.png",
        "32":    req.session.organization.logos["32"]    || res.locals.host + "/favicon/32.png"
    };

    next();
}
