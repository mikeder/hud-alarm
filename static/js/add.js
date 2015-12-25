$('#alarm_time').datetimepicker({
    dateFormat: 'mm-dd-yy',
    timeFormat: 'HH:mm'
    //format:'unixtime'
});

// Downtime list of hosts
$('#add_alarm').submit(function(e){
    e.preventDefault();
    $('#set_downtime').toggleClass('active');
    var hosts = [];
    hosts = $('#hostlist').val().split(/\n|,/);

    var data = { 'hosts': hosts,
                 'start_time': new Date().getTime() / 1000,
                 'end_time': $('#downtime_to').val(),
                 'author': $('#author').val(),
                 'comment': $('#comment').val() }

    var check = validateData(data);
    if (check == false) {
        console.log('Check failed aborting')
        return;
    }
    else {
        console.log('Check passed, calling API')
        $.ajax({
            url: '/api/alarm',
            type: 'POST',
            data: JSON.stringify(data),
            success: function(data) {
                alert('Successfully sent downtime command to Shinken.')
            },
            error: function(data) {
                alert(JSON.parse(data.responseText)['message']);
                setTimeout(function(){location.reload(true);}, 10);
            }
        });
    }
});