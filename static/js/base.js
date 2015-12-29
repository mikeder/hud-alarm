// Check focus of page
var hasFocus = '1';
window.onblur = function () {hasFocus = '0';}
window.onfocus = function () {hasFocus = '1';}

// Start heartbeat
window.onload = function poll() {
    setTimeout( function() {
        $.ajax({
            url: '/api/heartbeat',
            type: 'POST',
            data: hasFocus,
            success: function(data) {
                clearError();
                poll();  //call your function again after successfully calling the first time.
            },
            error: function(data) {
                showConnectionError();
                setTimeout(poll(), 5000);
            }
        });
    }, 5000);
};

//Error reporting
function showConnectionError(){
    var msg = "<p align='center'><strong>Error connecting to server.</strong></p>"
    $("#banner").html(msg).addClass('ui-state-error ui-corner-all');
}
function showSuccess(){
    var msg = "<p align='center'><strong>Successfully added new event!</strong></p>"
    $("#banner").html(msg).addClass('ui-state-highlight ui-corner-all');
}
function clearError(){
    var msg = ""
    $("#banner").html(msg).removeClass('ui-state-error ui-corner-all');
}