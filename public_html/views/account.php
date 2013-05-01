<?php
require_once($_SERVER['DOCUMENT_ROOT'].'/php/user/restrict.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/php/core/config.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/php/template/dependencies.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/php/core/database.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/includes/signature.php');
getDependencies(["core", "header", "account", "icons"]);
if($_GET['github'] > 1) {
    if($_GET['github'] == 2) {
        $_SESSION['github_redirect'] = "/documents/";
    }

    echo "<script type='text/javascript'>window.location.href = '".$_SESSION['github_auth_url']."'</script>";
}
$title = "My Account";
?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<?php include($_SERVER['DOCUMENT_ROOT']."/includes/meta_tags.php"); ?>
	<?php placeDependencies(); ?>
</head>
<body>
    <?php include($_SERVER['DOCUMENT_ROOT']."/includes/header.php"); ?>
    <div id="navigation">
        <div id="navigation_header"><?php echo $GLOBALS['row_Users']['user_name']; ?></div>
        <?php if(!is_null($GLOBALS['row_Users']['user_pricing'])) { ?>
        <div id="navigation_password_file">
            <div id="navigation_password_header" class="left">PRIVATE DOCUMENTS</div>
            <div id="navigation_password_header_light" class="right">
                <?php if($GLOBALS['row_Users']['pricing_name'] == "Unlimited") {
                    echo "2";
                } else {
                    echo "2 of ".number_format($GLOBALS['row_Users']['pricing_documents']);
                } ?>
            </div>
            <div class="clear"></div>
        </div>
        <?php } ?>
        <ul>
            <li id="profile">Public Profile</li>
            <li id="account">Account Settings</li>
            <li id="github">Github Locations</li>
            <li id="sftp">SFTP Locations</li>
            <li id="billing">Billing Options</li>
            <li id="payments">Payment History</li>
        </ul>
    </div>
    <div id="setting_pane">
        <div class="notification"></div>

        <div id="settings_profile" class="settings">
            <div class="settings_header">Public Profile</div>
            <div class="settings_content">
                asdfasdfasdf
            </div>
        </div>

        <div id="settings_github" class="settings">
            <div class="settings_header">
                <div class="left">Github Repositories</div>
                <?php if(is_null($GLOBALS['row_Users']['user_github'])) { ?>
                    <a class="button green right" href="<?php echo $_SESSION['github_auth_url']; ?>">Authorize With Github</a>
                <?php } else { ?>
                    <a class="button red right" href="/php/locations/github_remove_token.php">Deauthorize With Github</a>
                <?php } ?>
                <div class="clear"></div>
            </div>
            <div class="settings_content">
                <ul class="table"></ul>
                <div id="need_github_login" class="hidden">
                    <div class="icon_big icon-github"></div>
                    <div class="bold">You Need To Be Authorized<br>With Github To View You Repositories</div>
                </div>
            </div>
        </div>

    </div>
</body>
</html>