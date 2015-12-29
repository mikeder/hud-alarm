import json
import logging
import datetime
from lib import WebHandlers


class Alarm(WebHandlers.BaseHandler):
    def post(self):
        data = json.loads(self.request.body)
        data['reoccurring'] = False
        print data
        try:
            self.database.addAlarm(data)
        except Exception as e:
            print e

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
        active = self.__checkActive(remote_ip)
        now = datetime.datetime.now()
        end = now + datetime.timedelta(minutes=1)
        client = {
            'startTime': now,
            'endTime': end,
            'clientID': remote_ip,
            'hasFocus': hasFocus
        }
        if active:
            self.database.updateClient(client)
            self.set_status(200,"Client updated")
        else:
            self.database.addClient(client)
            self.set_status(201,"Client added")
        self.logger.debug('Client %s, Focus %s' % (remote_ip,hasFocus))

    def __checkActive(self, a_ip):
        clients = self.database.getClients(a_ip)
        if clients:
            for client in clients:
                lastMinute = datetime.datetime.now()-datetime.timedelta(minutes=5)
                endTime = datetime.datetime.strptime(client['endTime'], "%Y-%m-%d %H:%M:%S.%f")
                if lastMinute < endTime:
                    return 1
            return 0
        else:
            return 0