<div id="popup" class="hidden">
    <div id="popup_header">
        <div id="popup_header_name" class="left"></div>
        <div id="popup_header_exit" class="right">X</div>
        <div class="clear"></div>
    </div>
    <div class="presets" id="location_add">
        <form>
            <table width="100%" cellpadding="0px" cellspacing="0px">
                <tr>
                    <td width="85">Name:</td>
                    <td><input autocomplete="off" type="text" class="input full" id="popup_location_name" name="location_name" placeholder="Dev Site"/></td>
                </tr>
                <?php if(!is_null($GLOBALS['row_Users']['user_github'])) { ?>
                    <tr>
                        <td width="85">Type:</td>
                        <td>
                            <select id="popup_location_type" class="select full">
                                <option value="sftp">SFTP</option>
                                <option value="github">Github Repository</option>
                            </select>
                        </td>
                    </tr>
                <?php } else { ?>
                    <input type="hidden" id="popup_location_type" value="sftp" />
                <?php } ?>
            </table>
            <div id="popup_location_sftp" class="selection">
                <table width="100%" cellpadding="0px" cellspacing="0px">
                    <tr>
                        <td width="85">Server:</td>
                        <td><input autocomplete="off" type="text" class="input full" id="popup_location_server" name="sftp_server" placeholder="192.168.1.1"/></td>
                    </tr>
                    <tr>
                        <td width="85">Folder:</td>
                        <td><input autocomplete="off" type="text" class="input full" id="popup_location_default" name="sftp_server_default" placeholder="/var/www/"/></td>
                    </tr>
                    <tr>
                        <td width="85">Username:</td>
                        <td><input autocomplete="off" type="text" class="input full" id="popup_location_username" name="sftp_user_name" placeholder="john"/></td>
                    </tr>
                    <tr>
                        <td width="85">Password:</td>
                        <td><input autocomplete="off" type="password" class="input full" id="popup_location_user_password" name="sftp_user_password" placeholder=""/></td>
                    </tr>
                </table>
            </div>
            <?php if(!is_null($GLOBALS['row_Users']['user_github'])) { ?>
                <div id="popup_location_github" class="hidden selection scroll">
                    <center id="github_empty" class="hidden" style="margin-top: 50px; color:red;">
                        <strong>You Do Not Have<br>Any Github Repositories</strong>
                    </center>
                </div>
            <?php } ?>
            <input type="submit" class="button blue full" value="Add Location" />
        </form>
    </div>
    <div class="presets" id="location_remove">
        <input type="button" class="button blue full" value="Yes, I am sure" />
    </div>
    <div class="presets" id="share_url">
        <input type="text" class="input full"/>
    </div>
    <div class="presets" id="rename">
        <form>
            <input type="text" class="input full selection"/>
            <input type="submit" class="button blue full" value="Rename Document" />
        </form>
    </div>
</div>
<div id="popup_backdrop" class="hidden"></div>