import datetime
import logging
import sqlite3

class AlarmDatabase:
    def __init__(self, a_config):
        self.logger = logging.getLogger('AlarmDB')
        self.database = sqlite3.connect(a_config['name'])
        self.current_version = a_config['version']
        self.__upgradeDatabase()

    ## Alarm Table Methods
    def addAlarm(self, a_alarm):
        sql = "INSERT INTO alarm(datetime,title,description,alarm_id) VALUES('{0}','{1}','{2}','{3}')".\
            format(a_alarm['datetime'],
                   a_alarm['title'],
                   a_alarm['description'],
                   a_alarm['alarm_id'])
        self.__updateDB(sql)

    def getAlarms(self):
        sql = "SELECT * FROM alarm ORDER BY datetime ASC"
        return self.__queryDB(sql)


    ## Client Table Methods
    def addClient(self, a_client):
        sql = "INSERT INTO client(startTime, endTime, clientID, hasFocus) VALUES('{0}','{1}','{2}','{3}')".\
            format(a_client['startTime'],
                   a_client['endTime'],
                   a_client['clientID'],
                   a_client['hasFocus'])
        self.__updateDB(sql)

    def getClients(self, a_client=None):
        if a_client:
            sql = "SELECT * FROM client where clientID = '{0}'".format(a_client)
        else:
            sql = "SELECT * FROM client"
        return self.__queryDB(sql)

    def updateClient(self, a_client):
        sql = "UPDATE client SET endTime = '{0}', hasFocus = '{1}' WHERE clientID = '{2}'".\
            format(a_client['endTime'],
                   a_client['hasFocus'],
                   a_client['clientID'])
        self.__updateDB(sql)


    ## Internal Class Methods
    def __updateDB(self, sql):
        try:
            cursor = self.database.cursor()
            self.logger.debug(sql)
            cursor.execute(sql)
            self.database.commit()
            return {
                    'status': 'ok',
                    'message': 'Update successful.'
                }
        except Exception as err:
            self.logger.error('\033[1;91mThere was an error while updating the database\033[1;m')
            self.logger.error('\033[1;91m%s\033[1;m' % (err, ))
            return {
                    'status': 'error',
                    'message': err
                }

    def __queryDB(self, sql):
        self.database.text_factory = str
        self.database.row_factory = sqlite3.Row # This enables column access by name: row['column_name']
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

    ## Versioning methods
    def __checkVersion(self):
        sql = 'PRAGMA user_version'
        database_version = self.__queryDB(sql)[0][0]
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
            datetime DATETIME,
            title TEXT,
            description TEXT,
            alarm_id TEXT)'''
        cursor = self.database.cursor()
        cursor.execute(sql)
        self.database.commit()

    def __createClientTable(self):
        sql = '''
            CREATE TABLE IF NOT EXISTS
            client(id INTEGER PRIMARY KEY,
            startTime TIMESTAMP,
            endTime TIMESTAMP,
            clientID TEXT,
            hasFocus INTEGER)'''
        cursor = self.database.cursor()
        cursor.execute(sql)
        self.database.commit()