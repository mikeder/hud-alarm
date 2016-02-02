// Check focus of page
var hasFocus = '1';
var url = window.location.href;
window.onblur = function () {hasFocus = '0';}
window.onfocus = function () {hasFocus = '1';}

// Start heartbeat
window.onload = function poll() {
    setTimeout( function() {
        var data = { 'hasFocus': hasFocus,
                     'url': url }
        $.ajax({
            url: '/api/heartbeat',
            type: 'POST',
            data: JSON.stringify(data),
            success: function(data) {
                hideMessage;
                poll();  //call your function again after successfully calling the first time.
            },
            error: function(data) {
                showMessage('error','Error connecting to server...');
                setTimeout(poll(), 5000);
            }
        });
    }, 5000);
};

// Countdown
$('[data-countdown]').each(function() {
   var $this = $(this), finalDate = $(this).data('countdown');
   console.log($this);
   $this.countdown(finalDate, function(event) {
     $this.html(event.strftime('%D days %H:%M:%S'));
   })
     .on('finish.countdown', function(event) {
        PlaySound("sound1");
        setTimeout(window.close(), 10000);
     });
});

$('#close').click(function(e) {
    e.preventDefault();
    window.close();
});

// Sound Alarm
function PlaySound(soundObj) {
  document.getElementById(soundObj).play();
};

// Display Banner Message
function showMessage( type, msg ){
    var newClass = 'ui-state-highlight'
    if (type == 'error') {
        newClass = 'ui-state-error'
    }
    $("#banner").html(msg).addClass(newClass);
}

function hideMessage(){
    $("#banner").html(msg).removeClass('ui-state-error ui-corner-all');
}