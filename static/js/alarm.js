// Check focus of page
var hasFocus = '1';
var url = window.location.href;
window.onblur = function () {hasFocus = '0';}
window.onfocus = function () {hasFocus = '1';}

function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    }
  }
}

addLoadEvent(poll);

// Start heartbeat
function poll() {
    console.log('poll()')
    setTimeout( function() {
        var uuid = document.cookie;
        var data = { 'focus': hasFocus,
                     'url': url,
                     'uuid': uuid };
        $.ajax({
            url: '/api/heartbeat',
            type: 'POST',
            data: JSON.stringify(data),
            success: function(data) {
                console.log(data)
                hideMessage();
                document.cookie = data.client;
                if (data.refresh == 1){
                    console.log('New data available, refreshing page')
                    setTimeout(function(){location.reload(true);}, 100);
                } else {
                    console.log('No new data available')
                    poll();  //call your function again after successfully calling the first time.
                }
            },
            error: function(data) {
                showMessage('error','Error connecting to server...');
                setTimeout(poll(), 5000);
            }
        });
    }, 5000);
}

// Countdown
$('[data-countdown]').each(function() {
   var $this = $(this), finalDate = $(this).data('countdown');
   console.log($this);
   $this.countdown(finalDate, function(event) {
     $this.html(event.strftime('%D days %H:%M:%S'));
   })
     .on('finish.countdown', function(event) {
        PlaySound("sound1");
        FlashBanner();
     });
});

function FlashBanner(){
    setTimeout(showMessage('error', 'Alert'), 1000);
    setTimeout(showMessage('', 'Time is up'), 1000);
    setTimeout(showMessage('error', 'Alert'), 1000);
    setTimeout(showMessage('', 'Time is up'), 1000);
    setTimeout(showMessage('error', 'Alert'), 1000);
}

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
    $("#banner").html('').removeClass('ui-state-error ui-corner-all');
}