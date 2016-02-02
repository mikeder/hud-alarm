// Initial setup of UI Accordion
$('#accordion').accordion({collapsible: true, active: false, heightStyle: "content"});

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

addLoadEvent(getAlarms);
addLoadEvent(poll);


function getAlarms(){
    console.log('getAlarms()')
    $.getJSON('/api/alarm', function(data){
        var alarms = data.alarms;
        if (alarms.length > 0) {
            alarms.forEach(updateAccordion);
        } else {
            console.log('There are NO alarms')
        }
    })
}

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
                poll();  //call your function again after successfully calling the first time.
            },
            error: function(data) {
                showMessage('error','Error connecting to server...');
                setTimeout(poll(), 5000);
            }
        });
    }, 5000);
}

function startListeners(){
    console.log('startListeners()')
    // Delete Button listener
    $('.delete').click(function(e) {
        e.preventDefault()
        var alarm_id = $(this).val();
        console.log(alarm_id)
        deleteAlarm( alarm_id )
    })
}

// Add an alarm to the accordion
function updateAccordion( alarm ){
    console.log('updateAccordion()')
    var counter = "<p id='"+alarm.alarm_id+"'></p>";
    var head = "<h3>"+alarm.title+" - "+alarm.endtime+"</h3>";
    var body = "<article data-endtime='"+alarm.endtime+"'data-alarmid='"+alarm.alarm_id+"' data-open='"+alarm.open+"'>"+
                "<b>Perform the following: </b>"+
                alarm.description+
                "<b>Time Remaining: </b>"+
                counter+"<hr>"+
                "<button class='delete btn btn-danger' style='float: right;' value='"+alarm.alarm_id+"'>Delete</button>"+
                "</article>";
    $('#accordion').append(head+body)
    $('#accordion').accordion('refresh')
    getCounters();
}

// Loop through article elements, add timers to each one
function getCounters(){
    console.log('getCounters()')
    $('article').each(function() {
        var finalDate = $(this).data('endtime');
        var alarm_id = $(this).data('alarmid');
        var open_at = $(this).data('open');
        var $el = $('#'+ alarm_id);
        console.log(alarm_id)
        addCountdown( $el, finalDate, alarm_id, open_at )
    })
    startListeners();
}

// Add countdown timer to element
function addCountdown( $el, finalDate, alarm_id, open_at ) {
    console.log('addCountdown()')
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
        })
}

// Open /alarm endpoint for given ID
function triggerAlarmOpen( alarm_id ) {
    console.log('triggerAlarmOpen()' + alarm_id)
    window.open('/alarm/' + alarm_id);
}

// Delete Alarm
function deleteAlarm( alarm_id ){
    console.log('deleteAlarm()' + alarm_id)
    $.ajax({
        url: '/api/alarm/' + alarm_id,
        type: 'DELETE',
        success: function(data) {
            showMessage('',data.message);
            setTimeout(function(){location.reload(true);}, 100);
        },
        error: function(data) {
            showMessage('error',data.message);
            setTimeout(function(){location.reload(true);}, 8000);
        }
    })
}

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
                showMessage('',data.message);
                setTimeout(function(){location.reload(true);}, 100);
            },
            error: function(data) {
                showMessage('error',data.message);
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
    })

    form = dialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        addEvent();
    })

    $( "#addEvent" ).button().on( "click", function() {
        dialog.dialog( "open" );
    })
})