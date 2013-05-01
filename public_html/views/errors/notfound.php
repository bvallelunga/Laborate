<?php
require_once($_SERVER['DOCUMENT_ROOT'].'/php/core/config.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/php/template/dependencies.php');
require_once($_SERVER['DOCUMENT_ROOT'].'/includes/signature.php');
getDependencies(["core", "backdrop"]);
$title = "Not Found";
?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<?php include($_SERVER['DOCUMENT_ROOT']."/includes/meta_tags.php"); ?>
    <?php placeDependencies(); ?>
</head>
<body>
    <div id="backdrop">
        <div id="backdropCore">
            <a href="http://<?php echo $_SERVER["HTTP_HOST"]; ?>/"><div id="backDropLogo">code-laborate</div></a>
            <!-- Start: Backdrop Error -->
            <div id="backdropInital">
                <div class="backdropContainer">
                    <div class="seperatorRequired" style="text-align: center;">
                        <img src="http://resources.<?php echo $_SERVER["HTTP_HOST"]; ?>/img/error_big.png" width="100px" height="125px"/>
                    </div>
                    <div class="backdropInitalWelcome" style="font-size: 16px;">
                        Sorry, this page is not available.<br/>Please continue back <a href="/">home</a>.
                    </div>
                </div>
            </div>
            <!-- End: Backdrop Error -->
        </div>
    </div>
</body>
</html>