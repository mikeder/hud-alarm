import logging
import os
import sqlite3

class AlarmDatabase:
    def __init__(self, a_config):
        dbloc = a_config['location'] + a_config['name']
        os.makedirs(a_config['location'])
        self.logger = logging.getLogger(__name__)
        self.database = sqlite3.connect(dbloc)
        self.current_version = a_config['version']
        self.__upgradeDatabase()

    ## Alarm Table Methods
    def addAlarm(self, a_alarm):
        a_alarm['expired'] = 0
        sql = "INSERT INTO alarm(endtime,title,description,alarm_id,open,close,expired)" \
              " VALUES('{0}','{1}','{2}','{3}','{4}','{5}','{6}')".format(a_alarm['endtime'],
                                                                          a_alarm['title'],
                                                                          a_alarm['description'],
                                                                          a_alarm['alarm_id'],
                                                                          a_alarm['open'],
                                                                          a_alarm['close'],
                                                                          a_alarm['expired'])
        response = self.__updateDB(sql)
        return response

    def deleteAlarm(self, a_alarm_id):
        sql = "DELETE FROM alarm WHERE alarm_id = '{0}'".format(a_alarm_id)
        response = self.__updateDB(sql)
        return response

    def expireAlarm(self, a_alarm_id):
        sql = "UPDATE alarm SET expired = 1 WHERE alarm_id = '{0}'".format(a_alarm_id)
        response = self.__updateDB(sql)
        return response

    def getAlarms(self, a_alarm_id=None, is_expired=False):
        if a_alarm_id:
            sql = "SELECT * FROM alarm WHERE alarm_id = '{0}'".format(a_alarm_id)
        elif is_expired:
            sql = "SELECT * FROM alarm WHERE expired = 1 ORDER BY endtime ASC"
        else:
            sql = "SELECT * FROM alarm WHERE expired = 0 ORDER BY endtime ASC"
        return self.__queryDB(sql)


    ## Client Table Methods
    def addClient(self, a_client):
        sql = "INSERT INTO client(start, end, uuid, address, focus, url, refresh)\
               VALUES('{0}','{1}','{2}','{3}','{4}','{5}','{6}')".format(a_client['start'],
                                                                         a_client['end'],
                                                                         a_client['uuid'],
                                                                         a_client['address'],
                                                                         a_client['focus'],
                                                                         a_client['url'],
                                                                         a_client['refresh'])
        response = self.__updateDB(sql)
        if response['status'] == 'ok':
            response['client'] = a_client['uuid']
        elif response['status'] == 'error':
            pass
        return response

    def getClients(self, a_client=None):
        if a_client:
            sql = "SELECT * FROM client WHERE uuid = '{0}'".format(a_client)
        else:
            sql = "SELECT * FROM client"
        return self.__queryDB(sql)

    def updateClient(self, a_client):
        sql = "UPDATE client SET end = '{0}', focus = '{1}', refresh = 0 WHERE uuid = '{2}'".\
            format(a_client['end'],
                   a_client['focus'],
                   a_client['uuid'],
                   a_client['address'])
        response = self.__updateDB(sql)
        if response['status'] == 'ok':
            response['client'] = a_client['uuid']
        elif response['status'] == 'error':
            pass
        return response

    def setUpdateDue(self, a_uuid:str=None):
        if a_uuid:
            sql = "UPDATE client SET refresh = 1 WHERE uuid != {0}".format(str(a_uuid))
        else:
            sql = "UPDATE client SET refresh = 1"
        response = self.__updateDB(sql)
        return response

    def getUpdateDue(self, a_uuid):
        sql = "SELECT refresh FROM client WHERE uuid = {0}".format(str(a_uuid))
        response = self.__queryDB(sql)
        return response

    ## Internal Class Methods
    def __updateDB(self, sql):
        try:
            cursor = self.database.cursor()
            self.logger.debug(sql)
            cursor.execute(sql)
            self.database.commit()
            return
        except Exception as err:
            self.logger.error('\033[1;91mThere was an error while updating the database\033[1;m')
            self.logger.error('\033[1;91m%s\033[1;m' % (err, ))
            raise

    def __queryDB(self, sql):
        self.database.text_factory = str
        self.database.row_factory = self.dict_factory
        try:
            cursor = self.database.cursor()
            self.logger.debug(sql)
            cursor.execute(sql)
            result = cursor.fetchall()
            if len(result) == 0:
                self.logger.debug('Found %s records', len(result))
                return None
            else:
                self.logger.debug('Found %s records', len(result))
                return result
        except Exception as err:
            self.logger.error('\033[1;91mThere was an error while querying the database\033[1;m')
            self.logger.error('\033[1;91m%s\033[1;m' % (err, ))
            return None

    def dict_factory(self, cursor, row):
        d = {}
        for idx, col in enumerate(cursor.description):
            d[col[0]] = row[idx]
        return d

    ## Versioning methods
    def __checkVersion(self):
        sql = 'PRAGMA user_version'
        database_version = self.__queryDB(sql)[0]['user_version']
        self.logger.debug('Database is currently version %s' % database_version)
        return database_version

    def __upgradeDatabase(self):
        database_version = self.__checkVersion()
        version_idx = 1
        while database_version < self.current_version:
            self.logger.info('Upgrading Database to version %s' % self.current_version)
            self.__toVersion(version_idx)
            version_idx += 1
            database_version = self.__checkVersion()
        self.logger.info('Database is up to date')

    def __incrementPragmaUserVersion(self, version):
        sql = "PRAGMA user_version = '{0}'".format(version)
        cursor = self.database.cursor()
        cursor.execute(sql)
        self.database.commit()

    # Define version upgrades
    def __toVersion(self, version):
        if version == 1:
            self.__createAlarmTable()
            self.__createClientTable()
            self.__incrementPragmaUserVersion(version)

    def __createAlarmTable(self):
        sql = '''
            CREATE TABLE IF NOT EXISTS
            alarm(id INTEGER PRIMARY KEY,
            endtime DATETIME,
            title TEXT,
            description TEXT,
            alarm_id TEXT,
            open INTEGER,
            close INTEGER,
            expired INTEGER)'''
        cursor = self.database.cursor()
        cursor.execute(sql)
        self.database.commit()

    def __createClientTable(self):
        sql = '''
            CREATE TABLE IF NOT EXISTS
            client(id INTEGER PRIMARY KEY,
            start TIMESTAMP,
            end TIMESTAMP,
            uuid TEXT,
            address TEXT,
            focus INTEGER,
            refresh INTEGER,
            url TEXT)'''
        cursor = self.database.cursor()
        cursor.execute(sql)
        self.database.commit()