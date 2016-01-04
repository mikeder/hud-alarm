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
    $( "#accordion" ).accordion();
});

// Loop through article elements, add timers to each one
$('article').each(function( index ) {
    var $el = $('#countdown' + index),
        finalDate = $(this).data('countdown'),
        alarm_id = $(this).data('alarmid');
        addCountdown( $el, finalDate, alarm_id );
});

// Add countdown timer to Element
function addCountdown( $el, finalDate, alarm_id ) {
    var alarmOpened = false;
    $el.countdown(finalDate, function(event) {
        $el.html(event.strftime('%D days %H:%M:%S'));
    })
        .on('update.countdown', function(event) {
            var minutesLeft = event.strftime('%M');
            //checkAlarmOpen();
            if (minutesLeft < '10' && alarmOpened == false) {
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
    var alarm_id = $(this).val();
    e.preventDefault();
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
    $("#banner").removeClass('ui-state-error ui-corner-all');
}

//Begin JQuery UI Modal Dialog
$(function() {
    var dialog, form,
        title = $( "#title" ),
        description = $( "#description" ),
        datetime = $( "#datetime" ).datetimepicker({
            dateFormat: 'mm-dd-yy',
            timeFormat: 'HH:mm',
            minDate: '0'
        }),
        allFields = $( [] ).add( title ).add( description ).add( datetime ),
        tips = $( ".validateTips" );

    function addEvent() {
        var valid = true;
        allFields.removeClass( "ui-state-error" );
        var data = { 'title': title.val(),
        'description': description.val(),
        'datetime': datetime.val() }
        if ( valid ) {
            $.ajax({
                url: '/api/alarm',
                type: 'POST',
                data: JSON.stringify(data),
            success: function(data) {
                showMessage('','Successfully added new event!');
                setTimeout(function(){location.reload(true);}, 100);
            },
            error: function(data) {
                showMessage('error','Error while adding new event, try again.');
                setTimeout(function(){location.reload(true);}, 100);
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
            allFields.removeClass( "ui-state-error" );
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
