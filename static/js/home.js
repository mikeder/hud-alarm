// Check focus of page
var hasFocus = '1';
window.onblur = function () {hasFocus = '0';}
window.onfocus = function () {hasFocus = '1';}

// Start heartbeat
window.onload = function poll() {
    setTimeout( function() {
        $.ajax({
            url: '/api/heartbeat',
            type: 'POST',
            data: hasFocus,
            success: function(data) {
                clearError();
                poll();  //call your function again after successfully calling the first time.
            },
            error: function(data) {
                showConnectionError();
                setTimeout(poll(), 5000);
            }
        });
    }, 5000);
};
// Countdown
$('[data-countdown]').each(function() {
   var $this = $(this), finalDate = $(this).data('countdown');
   $this.countdown(finalDate, function(event) {
     $this.html(event.strftime('%D days %H:%M:%S'));
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

  // From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
  emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  title = $( "#title" ),
  description = $( "#description" ),
  datetime = $( "#datetime" ).datetimepicker({
    dateFormat: 'mm-dd-yy',
    timeFormat: 'HH:mm'
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
  height: 300,
  width: 350,
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
  addUser();
});

$( "#addEvent" ).button().on( "click", function() {
  dialog.dialog( "open" );
});
});