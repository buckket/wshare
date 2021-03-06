var reconnect_timer, ws_uri, url; 

$(document).ready(function() {
    
    wsinit();
    $("#notify-bottom").notify();


    $("#wshare_submit").click(function() {

        //Disable input
        ws_disableInput();

        //Getting URL
        url = $('input[name=wshare_url]');

        //Checking for valid URL
        if (! isUrl(url.val())) {
            $('.control-group').addClass('error');
            $('#wshare_url').removeAttr('disabled');
            $('#wshare_submit').button('reset');
            $('#wshare_submit').removeClass('btn-primary').addClass('btn-danger');
            return false;

        }
        else {
            $('.control-group').removeClass('error');
            $('#wshare_submit').removeClass('btn-danger').addClass('btn-primary');
        }

        $.ajax({
            url: "save",
            type: "GET",
            data: encodeURI('url=' + url.val()),
            success: function (returnData) {
                //Reenable input
                ws_enableInput();
                $('#wshare_url').val('').focus();
            }
        });

        return false;
    });

});

wsinit = function() {
    ws_uri = "ws://188.192.99.95:3000/ws";
    if (typeof WebSocket !== "undefined" && WebSocket !== null) {
        webSocket = typeof WebSocket === "function" ? new WebSocket(ws_uri) : void 0;
    } else if (typeof MozWebSocket !== "undefined" && MozWebSocket !== null) {
        webSocket = new MozWebSocket(ws_uri);
    } else {
        return;
    }

    webSocket.onopen = function() {
        clearTimeout(reconnect_timer);
        $('#wshare_status').html("We're live...");
        $('#wshare_user').show();
    }

    webSocket.onclose = function() {
        $('#wshare_status').html("Connection lost, reconnecting...");
        $('#wshare_user').hide();
        reconnect_timer = setTimeout("reconnect_failed()", 6000);
        webSocket.close();
        webSocket = null;
        return wsinit();
    }

    webSocket.onmessage = function(e) {
        var data = jQuery.parseJSON(e.data);
        if (data.type == 'logOn') {
            if (data.flag == 0) {
                $("#notify-bottom").notify("create", {
                    title: 'wShare',
                    text: "User connected... (" + data.count + " in total)"
                }); 
            }
            $('#wshare_user').html(" (" + data.count + " online)");
        }
        else if (data.type == 'logOff') {
            $("#notify-bottom").notify("create", {
                title: 'wShare',
                text: "User disconnected... (" + data.count + " remaining)" 
            });
            $('#wshare_user').html(" (" + data.count + " online)");
        }
        else if (data.type == 'thing') {
            var temp = $('#wshare_thinghidden').clone();
            temp.hide();
            temp.removeAttr('id');
            $('.url', temp).append("<a href='" + data.url + "'>" + data.url + "</a>");
            $('.subtitle', temp).append(data.subtitle);

            if ($('.thing').length >= 11) {
                $('.thing:last-child').fadeOut('fast', function() {
                    $('.thing:last-child').remove()
                    temp.insertAfter('#wshare_thinghidden');
                    temp.fadeIn('slow');
                });   
            } else {
                temp.insertAfter('#wshare_thinghidden');
                temp.fadeIn('slow');
            }
        }
    }
}

function reconnect_failed() {
    return $('#wshare_status').html("Connection lost, please reload...");
}

function isUrl(s) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}

function ws_disableInput() {
    $('#wshare_url').attr('disabled', true);
    $('#wshare_submit').button('loading');
}

function ws_enableInput() {
    $('#wshare_submit').button('reset');
    $('#wshare_url').removeAttr('disabled');
}
