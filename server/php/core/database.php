<?php
require($_SERVER['DOCUMENT_ROOT'].'/php/core/config.php');
require($_SERVER['DOCUMENT_ROOT'].'/php/core/core.php');

global $database;
$hostname_database = "localhost";
$database_database = "code_".$_SERVER['PHP_AUTH_USER'];
$username_database = $_SERVER['PHP_AUTH_USER'];
$password_database = $_SERVER['PHP_AUTH_PW'];
$database = mysql_pconnect($hostname_database, $username_database, $password_database) or trigger_error(mysql_error(),E_USER_ERROR);
mysql_select_db($database_database, $database);

if (!function_exists("GetSQLValueString")) {
    function GetSQLValueString($theValue, $theType, $theDefinedValue = "", $theNotDefinedValue = "") {
        if (PHP_VERSION < 6) {
            $theValue = get_magic_quotes_gpc() ? stripslashes($theValue) : $theValue;
        }

        $theValue = function_exists("mysql_real_escape_string") ? mysql_real_escape_string($theValue) : mysql_escape_string($theValue);

        switch ($theType) {
        case "text":
          $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
          break;
        case "long":
        case "int":
          $theValue = ($theValue != "") ? intval($theValue) : "NULL";
          break;
        case "double":
          $theValue = ($theValue != "") ? doubleval($theValue) : "NULL";
          break;
        case "date":
          $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
          break;
        case "defined":
          $theValue = ($theValue != "") ? $theDefinedValue : $theNotDefinedValue;
          break;
        }
        return $theValue;
    }
}

global $Sessions, $row_Sessions;
$query_Sessions = 'SELECT * FROM sessions ORDER BY session_name ASC';
$Sessions = mysql_query($query_Sessions , $database) or die(mysql_error());
$row_Sessions = mysql_fetch_assoc($Sessions);

global $Sessions_id, $row_Sessions_id;
$query_Sessions_id = 'SELECT * FROM sessions WHERE session_id = '.GetSQLValueString($_GET['i'], "double");
$Sessions_id = mysql_query($query_Sessions_id , $database) or die(mysql_error());
$row_Sessions_id = mysql_fetch_assoc($Sessions_id);

global $Users, $row_Users;
$query_Sessions = "SELECT * FROM users LEFT JOIN pricing ON users.user_pricing = pricing.pricing_id WHERE users.user_id = '".GetSQLValueString($_SESSION['user'], "double")."'";
$Users = mysql_query($query_Sessions , $database) or die(mysql_error());
$row_Users = mysql_fetch_assoc($Users);

if(!is_null($GLOBALS['row_Users']['user_locations'])) {
    $GLOBALS['row_Users']['user_locations'] = aesDecrypt($GLOBALS['row_Users']['user_locations'], $_SESSION['cryptSalt']);
}

if(!is_null($GLOBALS['row_Users']['user_github'])) {
    $GLOBALS['row_Users']['user_github'] = aesDecrypt($GLOBALS['row_Users']['user_github'], $_SESSION['cryptSalt']);
}

if(!function_exists('session_alias')) {
    function session_alias($alias_id) {
        $query_Sessions = "SELECT * FROM session_aliases, sessions WHERE sessions.session_id = session_aliases.session_id AND session_aliases.alias_id = '".GetSQLValueString($alias_id, "double")."'";
        $Sessions = mysql_query($query_Sessions , $GLOBALS['database']) or die(mysql_error());
        $row_Sessions = mysql_fetch_assoc($Sessions);

        $deleteSQL = sprintf("DELETE FROM session_aliases WHERE session_aliases.alias_id = '".GetSQLValueString($alias_id, "double")."'");
        mysql_query($deleteSQL, $GLOBALS['database']) or die(mysql_error());

        if($row_Sessions['alias_id'] == $alias_id) {
            return $row_Sessions;
        } else {
            return false;
        }
    }
}
?>