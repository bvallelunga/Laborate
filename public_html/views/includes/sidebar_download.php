<?php
require_once($_SERVER['DOCUMENT_ROOT'].'/php/core/config.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/php/core/database.php');
?>
<div id="sidebar_download" class="sidebar_content_inner">
    <script type="text/javascript">
        $("#downloadFile").on("click", function() { window.sidebarUtil.downloadFile(); });
        $("#printButton").on("click", function() { window.sidebarUtil.printFile(); });
        $("#githubCommit").on("click", function() { window.sidebarUtil.commitFile(); });
        $("#saveToServer").on("click", function() { window.sidebarUtil.pushFile(); });
    </script>
    <?php if($GLOBALS['row_Sessions_id']['session_type'] == "github" && !is_null($GLOBALS['row_Users']['user_github'])) { ?>
        <div>
            <div class="header">Commit File</div>
            <div><input id="githubMessage" type="text" placeholder="Commit Message" spellcheck="false" class="input"/></div>
            <div>
                <div class="left" style="margin-top: 6px">Reference Issue</div>
                <div class="left" style="color:#666; margin:6px 2px 0px 5px">#</div>
                <input id="githubReference" type="text" placeholder="22" spellcheck="false" style="width:50px" class="input right"/>
                <div class="clear"></div>
            </div>
        </div>
        <input type="button" id="githubCommit" value="Commit File" class="button green full"/>
        <hr/>
    <?php } elseif($GLOBALS['row_Sessions_id']['session_type'] == "sftp") { ?>
        <input type="button" value="Save To Server" id="saveToServer" class="button green full"/>
        <hr/>
    <?php }  ?>
    <input type="button" value="Download Document" id="downloadFile" class="button blue full"/>
    <hr/>
    <input type="button" value="Print Document" id="printButton" class="button blue full"/>
</div>