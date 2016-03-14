import datetime
import json
import markdown
import uuid
import logging
import tornado.web
import tornado.ioloop
from lib import AppUtils


class BaseHandler(tornado.web.RequestHandler):
    def __init__(self, application, request, **kwargs):
        super(BaseHandler, self).__init__(application, request)
        self.logger = logging.getLogger(__name__)
        self.generator = AppUtils.Generator()
        self.stringutil = AppUtils.StringUtil()
        self.clientutil = AppUtils.ClientUtils()

    def write_error(self, status_code, **kwargs):
        self.render("error.html", error=status_code)

    # Properties provided by Application in hud-alarm.py
    @property
    def database(self):
        return self.application.database


class Alarm(BaseHandler):
    def get(self):
        alarms = self.database.getAlarms()
        self.finish({'alarms':alarms})

    def post(self):
        self.logger.debug('Received new alarm: %s' % self.request.body)
        data = json.loads(self.request.body)
        data['uuid'] = self.get_secure_cookie('client_uuid')
        data['title'] = self.stringutil.sanitize(data['title'])
        data['description'] = self.stringutil.sanitize(data['description'])
        data['description'] = markdown.markdown(data['description'])
        data['alarm_id'] = self.generator.random_string()
        response = self.database.addAlarm(data)
        if response['status'] == 'ok':
            # Set all client updateDue bits except for the one that is calling
            response = self.database.setUpdateDue(data['uuid'])
            self.finish(response)
        elif response['status'] == 'error':
            self.logger.error(response)
            self.finish(response)
        else:
            self.finish(response)

    @tornado.web.authenticated
    def delete(self):
        data = json.loads(self.request.body)
        self.logger.debug('Deleting: %s from database' % data['alarm_id'])
        # Set all client updateDue bits except for the one that is calling
        response = self.database.deleteAlarm(data['alarm_id'])
        self.database.setUpdateDue(data['uuid'])
        self.finish(response)


class Heartbeat(BaseHandler):
    def get(self):
        clients = self.database.getClients()
        if clients:
            self.finish({'clients':clients})
        else:
            self.finish('None')

    def post(self):
        # Full client columns:
        # start, end, uuid, address, focus, url
        # ajax will include: uuid(sometimes), focus, url
        data = json.loads(self.request.body)
        x_real_ip = self.request.headers.get("X-Real-IP")
        data['address'] = x_real_ip or self.request.remote_ip
        now = datetime.datetime.now()
        data['start'] = now
        data['end'] = now + datetime.timedelta(minutes=1)
        data['uuid'] = self.get_secure_cookie('client_uuid')
        if data['uuid']:
            try:
                update = self.database.getUpdateDue(data['uuid'])[0]
                response = self.database.updateClient(data)
                if update['refresh'] == 0 or update['refresh'] == '0':
                    response['refresh'] = 0
                elif update['refresh'] == 1 or update['refresh'] == '1':
                    response['refresh'] = 1
                self.logger.debug(response)
                self.set_status(200,'Client updated')
                self.finish(response)
            except TypeError as e:
                response = self.__addClient(data)
                self.logger.debug(response)
                self.set_status(201,'Client Added')
                self.finish(response)
        else:
            response = self.__addClient(data)
            self.logger.debug(response)
            self.set_status(201,'Client Added')
            self.finish(response)


    def __addClient(self, data):
        client_uuid = str(uuid.uuid4())
        self.set_secure_cookie('client_uuid',client_uuid)
        data['refresh'] = '0'
        data['uuid'] = client_uuid
        response = self.database.addClient(data)
        return response


class Test(BaseHandler):
    def get(self):
        self.clientutil.validateClient("")