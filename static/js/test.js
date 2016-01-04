var fiveSeconds = new Date().getTime() + 5000;
$('#clock').countdown(fiveSeconds, function(event) {
  $(this).html(event.strftime('%D days %H:%M:%S'));
}).on('finish.countdown', function(event) {PlaySound("sound1");});

// Sound Alarm
function PlaySound(soundObj) {
  document.getElementById(soundObj).play();
};