<?php
require($_SERVER['DOCUMENT_ROOT'].'/server/php/core/config.php');

function getDependencies($dependencies) {
    if(in_array("core", $dependencies)) {
        array_push($GLOBALS['js'],  "core/center.js", "core/core.js", "core/cookie.js", "core/colors.js");
        array_push($GLOBALS['css'], "core/core.css", "core/form.css", "core/colors.css");
    }

    if(in_array("editor", $dependencies)) {
        array_push($GLOBALS['js'],  "editor/editorInit.js", "editor/editor.js", "editor/editorUtil.js");
        array_push($GLOBALS['js'],  "editor/sidebar.js", "editor/users.js", "core/colors.js");
        array_push($GLOBALS['css'], "editor/editor.css", "editor/sidebar.css");
        array_push($GLOBALS['codeMirror_js'], "codemirror.js", "util/match-highlighter.js", "util/loadmode.js");
        array_push($GLOBALS['codeMirror_js'], "util/formatting.js", "util/search.js", "util/searchcursor.js");
        array_push($GLOBALS['codeMirror_css'], "codemirror.css", "codelaborate.css");
        getDependencies(["icons"]);
    }

    if(in_array("header", $dependencies)) {
        array_push($GLOBALS['css'], "core/header.css");
        array_push($GLOBALS['js'], "core/header.js");
    }

    if(in_array("chatroom", $dependencies)) {
        array_push($GLOBALS['js'], "editor/chatRoom.js");
        array_push($GLOBALS['css'], "editor/chatRoom.css");
        getDependencies(["jScroll"]);
    }

    if(in_array("jScroll", $dependencies)) {
        array_push($GLOBALS['js'],  "core/jscrollpane.js", "core/mousewheel.js");
        array_push($GLOBALS['css'], "core/jscrollpane.css");
    }

    if(in_array("print", $dependencies)) {
        array_push($GLOBALS['js'],  "editor/print.js");
        array_push($GLOBALS['css'], "editor/print.css");
        getDependencies(["codeMirror"]);
    }

    if(in_array("codeMirror", $dependencies)) {
        array_push($GLOBALS['codeMirror_js'], "codemirror.js", "util/loadmode.js");
        array_push($GLOBALS['codeMirror_css'], "codemirror.css", "codelaborate.css");
    }

    if(in_array("backdrop", $dependencies)) {
        array_push($GLOBALS['js'], "backdrop/backdrop.js", "core/cookie.js", "core/center.js", "core/core.js");
        array_push($GLOBALS['css'], "backdrop/backdrop.css");

        if($GLOBALS['backdropMode'] == "editor") {
            array_push($GLOBALS['js'], "backdrop/upload_file.js", "core/form.js");
        }

        if($GLOBALS['backdropMode'] == "login" || $GLOBALS['backdropMode'] == "register") {
            array_push($GLOBALS['js'], "backdrop/backdropUser.js");
        }
    }

    if(in_array("icons", $dependencies)) {
        array_push($GLOBALS['css'], "core/icons.css");
    }

    if(in_array("documents", $dependencies)) {
        array_push($GLOBALS['css'], "documents/documents.css");
        array_push($GLOBALS['js'], "documents/documents.js", "documents/documentsInit.js", "documents/documentsUtil.js");
    }

    if(in_array("account", $dependencies)) {
        array_push($GLOBALS['css'], "account/account.css");
        array_push($GLOBALS['js'], "account/account.js");
    }
}

function placeDependencies() {

    if($_SESSION['cache'] == true) { $cache = '&nc='.rand(0, 1000000000); }
    else { $cache = ""; }

    echo ('<!-- Opera Speed Dial Favicon -->
    <link rel="icon" type="image/png" href="/favicon/160.png" />
    <!-- Standard Favicon -->
    <link rel="icon" type="image/png" href="/favicon/16.png" />
    <!-- For iPhone 4 Retina display: -->
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="/favicon/114.png">
    <!-- For iPad: -->
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="/favicon/72.png">
    <!-- For iPhone: -->
    <link rel="apple-touch-icon-precomposed" href="/favicon/57.png">');

    if($GLOBALS['css']) {
        echo '<link href="/min/?b=css&amp;f='.implode(",", array_unique($GLOBALS['css'])).$cache.'" rel="stylesheet" type="text/css"/>';
    }

    if($GLOBALS['codeMirror_css']) {
        echo '<link href="/min/?b=lib&amp;f='.implode(",", array_unique($GLOBALS['codeMirror_css'])).$cache.'" rel="stylesheet" type="text/css"/>';
    }

    if($GLOBALS['js'] || $GLOBALS['codeMirror_js']) {
        echo '<script src="/js/core/jquery.js" type="text/javascript"></script>';
    }

    if($GLOBALS['js']) {
        echo '<script src="/min/?b=js&amp;f='.implode(",", array_unique($GLOBALS['js'])).$cache.'" type="text/javascript"></script>';
    }

    if($GLOBALS['codeMirror_js']) {
        echo '<script src="/min/?b=lib&amp;f='.implode(",", array_unique($GLOBALS['codeMirror_js'])).$cache.'" type="text/javascript"></script>';
    }
}

$GLOBALS['js'] = array();
$GLOBALS['css'] = array();
$GLOBALS['codeMirror_js'] = array();
$GLOBALS['codeMirror_css'] = array();
?>