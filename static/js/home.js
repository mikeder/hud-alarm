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
                console.log(data)
                hideMessage();
                poll();  //call your function again after successfully calling the first time.
            },
            error: function(data) {
                showMessage('error','Error connecting to server...');
                setTimeout(poll(), 5000);
            }
        });
    }, 5000);
};

// Accordion of upcoming events
$(function() {
    $( "#accordion" ).accordion({collapsible: true, active: true, heightStyle: "content"});
});

// Loop through article elements, add timers to each one
$('article').each(function( index ) {
    var $el = $('#countdown' + index),
        finalDate = $(this).data('countdown'),
        alarm_id = $(this).data('alarmid');
        open_at = $(this).data('open')
        addCountdown( $el, finalDate, alarm_id, open_at );
});

// Add countdown timer to Element
function addCountdown( $el, finalDate, alarm_id, open_at ) {
    var alarmOpened = false;
    $el.countdown(finalDate, function(event) {
        $el.html(event.strftime('%D days %H:%M:%S'));
    })
        .on('update.countdown', function(event) {
            var daysLeft = event.strftime('%D');
            var hoursLeft = event.strftime('%H');
            var minutesLeft = event.strftime('%M');
            
            //checkAlarmOpen();
            if ( daysLeft == '00' &&
                 hoursLeft == '00' &&
                 minutesLeft < open_at && alarmOpened == false) {
                triggerAlarmOpen(alarm_id);
                alarmOpened = true;
            }
        })
        .on('finish.countdown', function(event) {
            deleteAlarm( alarm_id );
        });
}

// Check if alarm window is already open
function checkAlarmOpen( alarm_id ) {
    $.getJSON( '/api/heartbeat')
        .done(function( data ) {
            $.each( data.items, function( item ) {
                console.log(item.url)
            })
        })
}

// Open /alarm endpoint for given ID
function triggerAlarmOpen( alarm_id ) {
    window.open('/alarm/' + alarm_id);
}

// Delete Alarm
function deleteAlarm( alarm_id ){
    $.ajax({
        url: '/api/alarm/' + alarm_id,
        type: 'DELETE',
        success: function(data) {
            location.reload(true);
        },
        error: function(data) {
            alert(JSON.parse(data.responseText)['message']);
            setTimeout(function(){location.reload(true);}, 10);
        }
    });
}

// Delete Button
$('.delete').click(function(e) {
    e.preventDefault();
    var alarm_id = $(this).val();
    deleteAlarm( alarm_id );
});

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

//Begin JQuery UI Modal Dialog
$(function() {
    var dialog, form,
        datetime = $( "#datetime" ).datetimepicker({
            dateFormat: 'mm-dd-yy',
            timeFormat: 'HH:mm',
            minDate: '0'
        });

    function addEvent() {
        var valid = true;
        var data = { 'title': $( "#title" ).val(),
        'description': $( "#description" ).val(),
        'endtime': datetime.val(),
        'open': $( "#open" ).val(),
        'close': 'None'}
        if ( valid ) {
            $.ajax({
                url: '/api/alarm',
                type: 'POST',
                data: JSON.stringify(data),
            success: function(data) {
                showMessage('',data.responseText);
                setTimeout(function(){location.reload(true);}, 100);
            },
            error: function(data) {
                //alert(JSON.parse(data.responseText)['message'])
                showMessage('error',data.responseText);
                setTimeout(function(){location.reload(true);}, 8000);
            }
            });
            dialog.dialog( "close" );
        }
        return valid;
    }

    dialog = $( "#dialog-form" ).dialog({
        autoOpen: false,
        height: 500,
        width: 455,
        modal: true,
        buttons: {
            "Create new event": addEvent,
            Cancel: function() {
                dialog.dialog( "close" );
            }
        },
        close: function() {
            form[ 0 ].reset();
        }
    });

    form = dialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        addEvent();
    });

    $( "#addEvent" ).button().on( "click", function() {
        dialog.dialog( "open" );
    });
});
