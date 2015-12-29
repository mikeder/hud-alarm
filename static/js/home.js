// Accordion of upcoming events
$(function() {
    $( "#accordion" ).accordion();
  });

// Countdown
$('[data-countdown]').each(function() {
   var $this = $(this), finalDate = $(this).data('countdown');
   $this.countdown(finalDate, function(event) {
     $this.html(event.strftime('%D days %H:%M:%S'));
   });
});

// Delete Button
$('#delete').click(function(e) {
    var alarm_id = $('#alarm_id').val();
    e.preventDefault();
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
});

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

    function updateTips( t ) {
        tips
        .text( t )
        .addClass( "ui-state-highlight" );
        setTimeout(function() {
            tips.removeClass( "ui-state-highlight", 1500 );
        }, 500 );
    }

    function checkLength( o, n, min, max ) {
        if ( o.val().length > max || o.val().length < min ) {
            o.addClass( "ui-state-error" );
            updateTips( "Length of " + n + " must be between " +
            min + " and " + max + "." );
            return false;
        } else {
            return true;
        }
    }

    function checkRegexp( o, regexp, n ) {
        if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
        } else {
        return true;
        }
    }

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
                showSuccess();
                setTimeout(function(){location.reload(true);}, 100);
            },
            error: function(data) {
                showConnectionError();
                setTimeout(function(){location.reload(true);}, 10);
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
