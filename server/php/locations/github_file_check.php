<?php
$GLOBALS['ajax_message'] = "File Does Not Exist";
$GLOBALS['ajax_only'] = true;
require($_SERVER['DOCUMENT_ROOT'].'/php/user/restrict.php');
require($_SERVER['DOCUMENT_ROOT'].'/php/core/config.php');
require($_SERVER['DOCUMENT_ROOT'].'/php/core/core.php');
require($_SERVER['DOCUMENT_ROOT'].'/php/core/database.php');

if(isset($_POST['location_id']) && isset($_POST['file'])) {
    $locations = jsonToArray($GLOBALS['row_Users']['user_locations']);
    if(array_key_exists($_POST['location_id'], $locations)) {
        if(array_key_exists('github_repository', $locations[$_POST['location_id']])) {
            $query_Sessions = "SELECT * FROM sessions WHERE sessions.session_external_path = '".$_POST['file']."'";
            $Sessions = mysql_query($query_Sessions , $database) or die(mysql_error());
            $row_Sessions = mysql_fetch_assoc($Sessions);

            if($_POST['file'] == $row_Sessions['session_external_path']) {
                echo $row_Sessions['session_id'];
            }
            else { echo $GLOBALS['ajax_message']; }
        } else { echo $GLOBALS['ajax_message']; }
    } else { echo $GLOBALS['ajax_message']; }
}

?>