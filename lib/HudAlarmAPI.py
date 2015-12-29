import json
import logging
import datetime
import markdown
from lib import WebHandlers

class Alarm(WebHandlers.BaseHandler):
    def post(self):
        data = json.loads(self.request.body)
        data['alarm_id'] = self.generator.random_string()
        data['description'] = markdown.markdown(data['description'])
        try:
            self.database.addAlarm(data)
        except Exception as e:
            print e

    def delete(self, a_alarm):
        self.logger.debug('Deleting: %s from database' % a_alarm)
        self.database.deleteAlarm(a_alarm)
        self.set_status(200,'success')

class Heartbeat(WebHandlers.BaseHandler):
    def get(self):
        clients = self.database.getClients()
        if clients:
            self.write(json.dumps( [dict(rec) for rec in clients] )) # Convert row object to JSON string
        else:
            self.write('None')

    def post(self):
        x_real_ip = self.request.headers.get("X-Real-IP")
        remote_ip = x_real_ip or self.request.remote_ip
        hasFocus = self.request.body
        existingClient = self.database.getClients(remote_ip)
        now = datetime.datetime.now()
        end = now + datetime.timedelta(minutes=1)
        client = {
            'startTime': now,
            'endTime': end,
            'clientID': remote_ip,
            'hasFocus': hasFocus
        }
        if existingClient is None:
            self.database.addClient(client)
            self.set_status(201,"Client added")
        else:
            self.database.updateClient(client)
            self.set_status(200,"Client updated")
        self.logger.debug('Client %s, Focus %s' % (remote_ip,hasFocus))