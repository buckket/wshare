var reconnect_timer, ws_uri, url; 

$(document).ready(function() {
    
 

    wsinit();


    $("#wshare_submit").click(function() {

        //Disable input
        $('#wshare_url').attr('disabled', true);
        $('#wshare_submit').button('loading');

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
                $('#wshare_submit').button('reset');
                $('#wshare_url').removeAttr('disabled');
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
        $('#wshare_wsinfo').html("We're live...");
    }

    webSocket.onclose = function() {
        $('#wshare_wsinfo').html("Connection lost, reconnecting...");
        reconnect_timer = setTimeout("reconnect_failed()", 6000);
        webSocket.close();
        webSocket = null;
        return wsinit();
    }

    webSocket.onmessage = function(e) {
        var data = jQuery.parseJSON(e.data);
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

function reconnect_failed() {
    return $('#wshare_wsinfo').html("Connection lost, please reload...");
}

function isUrl(s) {
    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}