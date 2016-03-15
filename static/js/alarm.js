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
        var data = { 'focus': hasFocus,
                     'url': url };
        $.ajax({
            url: '/api/heartbeat',
            type: 'POST',
            data: JSON.stringify(data),
            success: function(data) {
                console.log(data)
                hideMessage();
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
        setTimeout(closeMe, 10000);
     });
});

function FlashBanner(){
    $('#banner').html('<strong>Alert: </strong> Time has expired!').addClass('alert alert-danger fade in')
    $('#banner').delay(500).fadeIn('normal', function() {
      $(this).delay(2500).fadeOut();
    });
}

$('#close').click(function(e) {
    e.preventDefault();
    window.close();
});

// Sound Alarm
function PlaySound(soundObj) {
  document.getElementById(soundObj).play();
};

// Close Alarm
function closeMe() {
    window.close();
}

// Display Banner Message
function showMessage( type, msg ){
    var newClass = 'alert alert-success fade in'
    if (type == 'error') {
        newClass = 'alert alert-danger fade in'
    }
    $("#banner").html(msg).addClass(newClass);
}

function hideMessage(){
    $("#banner").html('').removeClass('alert alert-danger fade in');
}