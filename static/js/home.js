var hasFocus = '1';
window.onblur = function () {hasFocus = '0';}
window.onfocus = function () {hasFocus = '1';}

window.onload = function poll() {
    setTimeout( function() {
        $.ajax({
            url: '/api/heartbeat',
            type: 'POST',
            data: hasFocus,
            success: function(data) {
                poll();  //call your function again after successfully calling the first time.
            },
            error: function(data) {
                alert(JSON.parse(data.responseText)['message']);
                setTimeout(function(){location.reload(true);}, 10);
            }
        });
    }, 2000);
};