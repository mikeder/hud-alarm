// Countdown
$('[data-countdown]').each(function() {
   var $this = $(this), finalDate = $(this).data('countdown');
   $this.countdown(finalDate, function(event) {
     $this.html(event.strftime('%D days %H:%M:%S'));
   });
});

// Delete Button
$('#delete').click(function(e) {
    var alarm_id = $('#alarm_id').text();
    e.preventDefault();
    $.ajax({
        url: '/api/alarm/' + alarm_id,
        type: 'DELETE',
        success: function(data) {
            window.close();
        },
        error: function(data) {
            alert(JSON.parse(data.responseText)['message']);
            setTimeout(function(){location.reload(true);}, 10);
        }
    });
});

$('#close').click(function(e) {
    e.preventDefault();
    window.close();
});