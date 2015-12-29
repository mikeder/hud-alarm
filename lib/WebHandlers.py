import datetime
import json
import logging
import tornado.web
import tornado.ioloop
from lib import Utilities


class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(BaseHandler, self).__init__(application, request)
        self.logger = logging.getLogger('WebHandlers')
        self.generator = Utilities.Generator()

    def write_error(self, status_code, **kwargs):
        self.render("error.html", error=status_code)

    # Properties provided by Application in hud-alarm.py
    @property
    def database(self):
        return self.application.database

class Alarm(BaseHandler):
    def get(self, a_alarm_id):
        self.render('alarm.html', alarm_id=a_alarm_id)

class Home(BaseHandler):
    def get(self):
        alarms = self.database.getAlarms()
        if alarms is None:
            alarms = ''
        for alarm in alarms:
            now = datetime.datetime.now()
            endTime = datetime.datetime.strptime(alarm['datetime'], "%Y/%m/%d %H:%M")
            if now > endTime:
                alarms.remove(alarm)
        self.render('home.html', alarms=alarms, count=len(alarms))

class Test(BaseHandler):
    def get(self):
        self.render('test.html')