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
        if (alarms == null) {
            console.log('There are NO alarms')
        } else {
            alarms.forEach(updateAccordion);
            getCounters();
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
                if (data.refresh == 1){
                    console.log('New data available, refreshing page')
                    clearAccordion();
                } else {
                    console.log('No new data available')
                    poll();  //call your function again after successfully calling the first time.
                }
            },
            error: function(xhr, textStatus, error) {
                showMessage('error','<strong>Error:</strong> connection to server failed('+error+'), retrying...');
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
    $('#accordion').accordion({collapsible: true, active: false, heightStyle: "content"});
    var counter = "<p id='"+alarm.alarm_id+"'></p>";
    var header = "<h3>"+alarm.title+" - "+alarm.endtime+"</h3>";
    var open = "<article data-endtime='"+alarm.endtime+"'data-alarmid='"+alarm.alarm_id+"' data-open='"+alarm.open+"'>";
    if(alarm.description.length > 1){
        console.log('updateAccorion(): w/ description')
        var desc = "<b>Perform the following: </b>"+alarm.description;
    }else{
        console.log('updateAccordion(): no description')
        var desc = '';
    }
    var countdown = "<b>Time Remaining: </b>"+counter+"<hr>";
    var button = "<button class='delete btn btn-danger' style='float: right;' value='"+alarm.alarm_id+"'>Delete</button>"
    var close = "</article>";
    $('#accordion').append(header+open+desc+countdown+button+close)
    $('#accordion').accordion('refresh')
    //getCounters();
}

// Clear accordion prior to rebuilding
function clearAccordion(){
    console.log('clearAccordion()')
    $('#accordion').accordion('destroy');   // removes accordion bits
    $('#accordion').empty();                // clears the contents
    getAlarms();
    poll();
}

// Loop through article elements, add timers to each one
function getCounters(){
    console.log('getCounters()')
    $('article').each(function() {
        var finalDate = $(this).data('endtime');
        var alarm_id = $(this).data('alarmid');
        var open_at = $(this).data('open');
        var $el = $('#'+ alarm_id);
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
    var uuid = document.cookie;
    var data = { 'alarm_id': alarm_id,
                 'uuid': uuid }
    $.ajax({
        url: '/api/alarm',
        type: 'DELETE',
        data: JSON.stringify(data),
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
    var newClass = 'alert alert-success fade in'
    if (type == 'error') {
        newClass = 'alert alert-danger fade in'
    }
    $("#banner").html(msg).addClass(newClass);
}

function hideMessage(){
    $("#banner").html('').removeClass('alert alert-danger fade in');
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
        var uuid = document.cookie;
        var data = { 'title': $( "#title" ).val(),
                     'description': $( "#description" ).val(),
                     'endtime': datetime.val(),
                     'open': $( "#open" ).val(),
                     'close': 'None',
                     'uuid': uuid }
        $.ajax({
            url: '/api/alarm',
            type: 'POST',
            data: JSON.stringify(data),
            success: function(data) {
                showMessage('',data.message);
                setTimeout(function(){location.reload(true);}, 100);
            },
            error: function(xhr, textStatus, error) {
                showMessage('error','<strong>Error:</strong> '+error);
                setTimeout(poll(), 5000);
            }
        });
        dialog.dialog( "close" );
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