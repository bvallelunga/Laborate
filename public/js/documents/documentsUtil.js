/////////////////////////////////////////////////
//          Document Instances
/////////////////////////////////////////////////
window.documents = {
    popUp: function(preset, data) {
        //Inital Clean Up
        $("#popup .presets").hide();
        $("#popup .selection").hide();
        $("#popup .input, #popUp .select").val('').css({"border":""});
        $("#popup .selected").removeClass("selected");

        //Cycle Through Presets
        if(preset == "location_add") {
            $("#popup #location_add").show();
            $("#popup #location_add .selection").eq(0).show();
            $("#popup #popup_header #popup_header_name").text("New Location");
            $("#popup #location_add .select").val($("#popup #location_add .select option:first").val());
            $("#popup").css({"width": "280"});
        }

        if(preset == "location_delete") {
            $("#popup #location_remove").show();
            $("#popup #popup_header #popup_header_name").text("Confirm Location Deletion?");
            $("#popup").css({"width": "250"});
        }

        if(preset == "share_url") {
            $("#popup #share_url input[type=text]").val(data);
            $("#popup #share_url").show();
            $("#popup #popup_header #popup_header_name").text("Share Url");
            $("#popup").css({"width": "250"});
        }

        if(preset == "new_file") {
            $("#popup #new_file input[type=text]").css({"border":""});
            $("#popup #new_file").show();
            $("#popup #new_file .selection").show();
            $("#popup #popup_header #popup_header_name").text("Document Name");
            $("#popup").css({"width": "250"});
        }

        if(preset == "rename") {
            $("#popup #rename input[type=text]").val(data).css({"border":""});
            $("#popup #rename").show();
            $("#popup #rename .selection").show();
            $("#popup #popup_header #popup_header_name").text("Rename Document");
            $("#popup").css({"width": "250"});
        }

        if(preset == "photo_preview") {
            $("#popup #photo_preview").show();
            $("#popup #popup_header #popup_header_name").text(data[0]);
            $("#popup #photo_preview a").attr("href", data[1]);
            $("#popup #photo_preview img").attr("src", data[1]);
            $("#popup").css({"width": "300"});
            $('#image_preview').load(function() {
                $("#popup").hAlign().vAlign();
            });
        }

        //Auto Center And Show
        $("html, body").animate({ scrollTop: 0 }, ($(window).scrollTop()/2), function() {
            $("body").css("overflow", "hidden");
            $("#popup_backdrop").show();
            $("#popup").hAlign().vAlign().show();
        });
    },
    popUpClose: function() {
        //Remove Live Events From Forms
        $("#popup *").die();

        //Hide Pop Up
        $("#popup").hide();
        $("#popup_backdrop").hide();
        $("body").css("overflow", "");
    },
    contextMenu: function(element, e) {
        if($.trim(element.find(".file_attributes").text()) == "owner") { var action  = "Delete"; }
        else { var action = "Forget"; }

        $("#menu #action").text(action);

        if(($(window).width() - e.pageX) <= 130) { var left = e.pageX  - $("#menu").width(); }
        else { var left = e.pageX + 4; }

        $("#menu").css({"top": e.pageY + 16, "left": left}).attr("data", element.attr("data")).show();
    },
    contextMenuItem: function(element) {
        window.documents.contextMenuClose();
        var id = element.attr("id");
        var reference = $("#menu").attr("data");

        setTimeout(function() {
            if(id == "new") {
                window.documents.goToTab("/editor/");
            }

            if(id == "tab") {
                window.documents.goToTab("/editor/" + reference + "/");
            }

            if(id == "rename") {
                window.documents.popUp("rename", $("#file_" + reference + " .title").attr("data"));
                $("#popup #rename form").live("submit", function() {
                    var name = $("#popup #rename input[type=text]").val();
                    if(name) {
                        $("#file_"+reference+" .title").attr("data", name);
                        $("#file_"+reference+" .title").text(name);
                        window.documents.popUpClose();
                        $.post("/documents/file/" + reference + "/rename/", { name: name,  _csrf: $("#_csrf").text() },
                            function(json) {
                                if("error_message" in json) {
                                    window.notification.open(json.error_message);
                                } else {
                                    $("#popup #rename form").die();
                                }
                        });
                    } else {
                        $("#popup #rename input[type=text]").css({"border":"solid thin #CC352D"});
                    }

                    return false;
                });
            }

            if(id == "action") {
                $.post("/documents/file/" + reference + "/remove/", { _csrf: $("#_csrf").text() }, function(json) {
                    if("error_message" in json) {
                        window.notification.open(json.error_message);
                    } else {
                        $("#file_" + reference).animate({"opacity": 0}, 500);
                        setTimeout(function() {
                            $("#file_" + reference).remove();
                        }, 600);
                    }

                });
            }

            if(id == "share") {
                window.documents.popUp("share_url", location.protocol + '//' + location.host+ "/editor/" + reference + "/");
            }

        }, 100);
    },
    contextMenuClose: function() {
       $("#menu").hide();
    },
    locationChange: function(location_id, path, no_history) {
        $("#locations ul li").removeClass("selected");
        $("#" + location_id).addClass("selected");
        $("#files #file_library").html("");

        if(location_id == "online" || !location_id) {
            $("#online").addClass("selected");
            location_id = "online";
            window.documents.onlineDirectory(no_history);
        } else {
            window.documents.locationDirectory(location_id, path, no_history);
        }

        window.sidebar = location_id;
    },
    addLocation: function() {
        //Show Pop Up
        window.documents.popUp("location_add");

        //Look For Location Type Change
        $("#popup #popup_location_type").live("change", function() {
            $("#popup .selection").hide();

            if($(this).val() == "sftp") {
                $("#popup_location_sftp").show();
            }
            else {
                $("#popup_location_" + $(this).val()).show();
            }
            $("#popup").hAlign().vAlign();
        });

        //Add Select Class To Github Repository
        $("#popup #popup_location_github ul li").live("click", function() {
            if($("#popup #popup_location_name").val() == $("#popup #popup_location_github .selected").text()) {
                $("#popup #popup_location_name").val($(this).text());
            }

            $("#popup #popup_location_github ul li").removeClass("selected");
            $(this).addClass("selected");
        });

        //Check For Form Submit
        $("#popup #location_add form").live("submit", function() {
            var type = $("#popup #popup_location_type").val();
            var type_icon = type;
            var passed = true;
            var items = {"type": type};
            var exceptions = ['popup_location_default', 'popup_location_username'];

            //Check If Inputs Have Values
            if($("#popup #popup_location_name").val() == "") {
                $("#popup #popup_location_name").css({"border":"solid thin #CC352D"});
                passed = false;
            }
            else {
                $("#popup #popup_location_name").css({"border":""});
                items["name"] = $("#popup #popup_location_name").val();
            }

            $("#popup_location_" + type).find("input[type=text], select").each(function() {
                if($(this).val() == "" && $.inArray($(this).attr("id"), exceptions) == -1) {
                    $(this).css({"border": "solid thin #CC352D"});
                    passed = false;
                }
                else {
                    $(this).css({"border": ""});
                    items[$(this).attr("name")] = $(this).val();
                }
            });

            if($("#popup_location_" + type).find("input[type=password]").clone() != "") {
                var pass = $("#popup_location_" + type).find("input[type=password]");
                items[pass.attr("name")] = pass.val();
            }

            if(type == "github") {
                if($("#popup_location_" + type + " .selected").text() == "") {
                    $("#popup_location_" + type).css({"border": "solid thin #CC352D"});
                    passed = false;
                }
                else {
                    $("#popup_location_" + type).css({"border": ""});
                    items["repository"] = $("#popup_location_" + type + " .selected").text();
                }
            }

            if(passed) {
                $.post("/documents/location/create/", { locations_add: items, _csrf: $("#_csrf").text() },
                    function(json) {
                        if("error_message" in json) {
                            window.notification.open(json.error_message);
                        } else {
                            window.documents.locationListing();
                        }
                });
                $("#popup #popup_location_type").die();
                $("#popup #popup_location_github ul li").die();
                $("#popup #location_add form").die();
                window.documents.popUpClose();
            }
            return false;
        });
    },
    removeLocation: function(element) {
        var id = element.attr("id");
        window.documents.popUp("location_delete");

        $("#popup #location_remove input[type=button]").live("click", function() {
            $.post("/documents/location/remove/", { locations_remove: id, _csrf: $("#_csrf").text() }, function(json) {
                if("error_message" in json) {
                    window.notification.open(json.error_message);
                } else {
                    element.remove();

                    if(window.sidebar == id) {
                        window.documents.locationChange("online");
                    }

                    if($("#locations.remove ul li").size() == 1) {
                        $("#locations").removeClass("remove");
                        $("#locations #online").toggle().addClass("selected");
                    }
                }
            });
            $("#popup #location_remove input[type=button]").die();
            window.documents.popUpClose();
        });
    },
    toggleRemoveMode: function() {
        $("#locations").toggleClass("remove");
        $("#locations #online").toggle();
    },
    locationListing: function(location) {
        $.get("/documents/locations/",
            function(json) {
                var locations = "";
                $.each(json, function(i, item) {
                    if(item["type"] == "github") { var icon = "icon-github"; }
                    else if(item["type"] == "sftp") { var icon = "icon-drawer"; }
                    else { var icon = "icon-storage"; }
                    locations += '<li id="' + item['key'] + '" data="' + item['type'] + '">';
                    locations += '<div class="left icon ' + icon + '"></div>';
                    locations += '<div class="location_name">' + item['name'] + '</div>';
                    locations += '<div class="clear"></div></li>';
                });
                $("#locations ul li").not("li[id='online']").remove();
                $("#locations ul").append(locations);

                if(location) {
                    $("#" + location).addClass("selected");
                } else {
                    $("#" + window.sidebar).addClass("selected");
                }
            }
        );
    },
    cachedLocations: function(location_id) {
        if(window.cachedLocations == undefined) {
           window.cachedLocations = new Array();
        }

        if(window.cachedLocations["location_" + location_id] == undefined) {
            window.cachedLocations["location_" + location_id] = new Array();
        }

        return window.cachedLocations["location_" + location_id];
    },
    addcachedLocation: function(location_id, path, json) {
        if(window.cachedLocations["location_" + location_id] == undefined) {
            window.cachedLocations["location_" + location_id] = {}
        }

        if(path == "" || path == undefined) {
            path = "";
        }

        window.cachedLocations["location_" + location_id][path] = json;
    },
    goToLink: function(link) {
        window.location.href = link;
    },
    goToTab: function(link) {
        if(!window.open(link)) {
            window.location.href = link;
        }
    },
    newFile: function(path, location) {
        window.documents.popUp("new_file");

        $("#popup #new_file form").live("submit", function() {
            var name = $("#popup #new_file input[type=text]").val();
            if(name) {
                window.documents.popUpClose();
                if(location == "online") {
                    location = null;
                    window.notification.open("creating file");
                } else {
                    window.notification.open("creating file in current directory...");
                }

                $.post("/documents/file/create/", { name: name, external_path:  path, location: location, _csrf: $("#_csrf").text() },
                    function(json) {
                        if("error_message" in json) {
                            window.notification.open(json.error_message);
                        } else {
                            window.documents.goToTab("/editor/" + json.document + "/");
                            window.notification.close();
                            $("#popup #new_file form").die();
                        }
                });
            } else {
                $("#popup #new_file input[type=text]").css({"border":"solid thin #CC352D"});
            }
            return false;
        });
    },
    onlineDirectory: function(no_history) {
        window.notification.open("loading...");
        $.get("/documents/files/", function(json) {
            if("error_message" in json) {
                window.notification.open(json.error_message);
            } else {
                var files = "";
                $.each(json, function(i, item) {
                    var protection = (item.password) ? "password" : "open";
                    var location = (item.location) ? item['location'] : "";
                    var file = '<div id="file_' + item.id + '" class="file online" data="' + item.id + '">';
                    file += '<div class="file_attributes icon ' + protection + '" data="' + location + '">';
                    file += item.role.toLowerCase();
                    file += '</div>';
                    file += '<div class="title" data="' + item.name + '">' + item.name + '</div></div>';
                    files += file;
                });

                $("#files #file_library").append(files);

                window.notification.close();
                if(!no_history) history.pushState(null, null, "/documents/");
            }
        });
    },
    githubRepos: function() {
        $.get("/github/repos/", function(json) {
            if("error_message" in json) {
                if(json.error_message == "Bad Github Oauth Token") {
                    window.notification.open("Opps! Github Needs To Be <a href='" + json.github_oath + "'>Reauthorized</a>");
                } else {
                    window.notification.open(json.error_message);
                }

            } else {
                var repos = "";
                $.each(json, function(i, item) {
                    repos += '<li>' + item['user'] + '/<span class="bold">' + item['repo'] + '</span></li>'
                });

                if(repos) {
                    $("#popup_location_github").append("<ul>" + repos + "</ul>");
                } else {
                    $("#popup_location_github #github_empty").show();
                }
            }
        });
    },
    locationDirectory: function(location_id, path, no_history) {
        window.notification.open("loading...");
        var response = window.documents.cachedLocations(location_id);
        var files = "";

        path = $.trim(path)
        path = (path.slice(-1) == "/") ? path : path + "/";

        if(!path || path == "/") {
            path = "";
        }

        if(response[path] != undefined) {
            finish(response[path]);
        } else {
            $.get("/documents/location/" + location_id + "/" + path,
                function(json) {
                    if("error_message" in json) {
                        if(json.error_message == "Bad Github Oauth Token") {
                            window.notification.open("Opps! Github Needs To Be <a href='" + json.github_oath + "'>Reauthorized</a>");
                        } else {
                            window.notification.open(json.error_message);
                        }

                    } else {
                        window.documents.addcachedLocation(location_id, path, json);
                        finish(json);
                    }
                }
            );
        }

        function finish(response) {
            $.each(response, function(i, item) {
                switch(item["type"]) {
                    case "dir":
                        var type = "folder";
                        var icon = "folder";
                        var type_title = "folder";
                        break;
                    case "symlink":
                        var type = "folder";
                        var icon = "folder";
                        var type_title = "symlink";
                        break;
                    case "back":
                        var type = "folder";
                        var icon = "back";
                        var type_title = "back";
                        break;
                    case "file":
                        var type = "file";
                        var icon = "open";
                        if(item["extension"] && item["extension"].length <= 5) {
                            var type_title = item["extension"];
                        } else {
                            var type_title = "file";
                        }
                }

                var template = '<div class="file external" data="' + item["path"] + '">';
                template += '<div class="file_attributes ' + icon + '" data="' + type + '">' + type_title + '</div>';
                template += '<div class="title" data="' + item["name"] + '">' + item["name"] + '</div>';
                template += '</div>';
                files += template;
            });
            $("#files #file_library").html(files);
            window.notification.close();
            path = (path.substr(-1) != '/' && path) ? path + "/" : path;
            if(!no_history) history.pushState(null, null, "/documents/" + location_id + "/" + path);
        }
    },
    locationFile: function(location_id, element) {
        window.notification.open("downloading...");
        var path = element.parent().attr("data");

        $.get("/documents/location/" + location_id + "/" + path, function(json) {
            if("error_message" in json) {
                 window.notification.open(json.error_message);
            } else {
                window.documents.goToTab("/editor/" + json.document + "/");
                window.notification.close();
            }
        });
    },
    photoPreview: function(location_id, name, path) {
        var url = "/documents/location/" + location_id + "/" + path + "/";
        window.documents.popUp("photo_preview", [name, url]);
    },
    fileSearch: function(form) {
        var search = form.find("input[name=s]").val();
        var protection = form.find("select[name=p]").val();
        var relation = form.find("select[name=r]").val();
        var parent_location = form.parent("#location_template");

        parent_location.find(".file").each(function() {
            var show = true;
            if($(this).find(".title").attr("data").toLowerCase().indexOf(search) < 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });

        if(parent_location.find(".file:visible").length == 0 && parent_location.find(".file").length != 0) {
            $(".notFound").show();
            if($(window).width() < 1015) {
                parent_location.find("#newFile").hide();
                parent_location.find("#clearSearch").css("float","right");
            }
            else {
                parent_location.find("#newFile").show();
                parent_location.find("#clearSearch").css("float","left");
            }

            parent_location.find("#clearSearch").show();

        } else {
            parent_location.find(".notFound").hide();
            parent_location.find("#clearSearch").hide();
            parent_location.find("#newFile").show();
        }
    },
    fileSearchClear: function(element) {
        element.parent("form").find('input:text, select').val('');
        element.parent("form").submit();
    }
}
