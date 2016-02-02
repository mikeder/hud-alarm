import datetime
import json
import markdown
import uuid
from lib import WebHandlers

class Alarm(WebHandlers.BaseHandler):
    def get(self):
        alarms = self.database.getAlarms()
        self.finish({'alarms':alarms})

    def post(self):
        self.logger.debug('Received new alarm: %s' % self.request.body)
        data = json.loads(self.request.body)
        data['title'] = self.stringutil.sanitize(data['title'])
        data['description'] = self.stringutil.sanitize(data['description'])
        data['description'] = markdown.markdown(data['description'])
        data['alarm_id'] = self.generator.random_string()
        response = self.database.addAlarm(data)
        if response['status'] == 'success':
            self.finish(response)
        else:
            self.logger.error(response)
            self.finish(response)

    def delete(self, a_alarm):
        self.logger.debug('Deleting: %s from database' % a_alarm)
        response = self.database.deleteAlarm(a_alarm)
        self.finish(response)

class Heartbeat(WebHandlers.BaseHandler):
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
        self.logger.debug(data['uuid'])
        if data['uuid'] != '' or data['uuid']:
            response = self.database.updateClient(data)
            self.logger.debug(response)
            self.set_status(200,'Client updated')
            self.finish(response)
        else:
            data['uuid'] = str(uuid.uuid4())
            response = self.database.addClient(data)
            self.logger.debug(response)
            self.set_status(201,'Client Added')
            self.finish(response)