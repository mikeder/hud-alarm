import os
import sys
cwd = os.getcwd()
sys.path.append(cwd)
import getopt
import json
from lib import AppUtils
from lib import RestAPIHandlers
from lib import DatabaseUtils
from lib import WebHandlers
import logging
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import sys
from tornado.options import define, options

class Application(tornado.web.Application):
    def __init__(self):
        # Default config path
        config_path = 'conf/config.json'
        # Attempt to get config override from arguments
        try:
            opts, args = getopt.getopt(sys.argv, ['c='], ['config='])
        except getopt.GetoptError as err:
            print(err)
            sys.exit(2)
        # Override default config with config argument (if provided)
        for opt, arg in opts:
            if opt in ('-c', '--config'):
                config_path = arg
            else:
                print('Invalid flag: ', opt)
                sys.exit(2)
        # Finally load config file
        try:
            with open(config_path) as config_file:
                 config = json.load(config_file)
        except:
            print('Invalid config file: ', config_path)
            sys.exit(2)

        routes = [
            (r'/', WebHandlers.Home),
            (r'/test', RestAPIHandlers.Test),
            (r'/alarm/([A-Za-z0-9]+)', WebHandlers.Alarm),
            (r'/api/alarm', RestAPIHandlers.Alarm),
            (r'/api/heartbeat', RestAPIHandlers.Heartbeat),
            (r'.*', WebHandlers.BaseHandler)
        ]

        # Define application settings
        settings = dict(
            cookie_secret='<<SECRET>>',
            title=config['client']['title'],
            template_path=config['client']['template_path'],
            static_path=config['client']['static_path'],
            debug=True,
        )
        # Define default port based on config or override via CLI
        define('port', default=config['server']['port'], help='run on the given port', type=int)
        super(Application, self).__init__(routes, **settings)

        # Setup Global Logging
        loglevel = getattr(logging, config['logging']['log_level'].upper())
        loglocation = config['logging']['log_location']
        logformat = '[%(levelname)s] %(asctime)s - %(name)s : %(message)s'
        datefmt='%m/%d/%Y %I:%M:%S %p'
        logger = logging.getLogger(__name__)

        if config['logging']['log_to_file']:
            logging.basicConfig(
                filename=loglocation,
                format=logformat,
                datefmt=datefmt,
                level=loglevel)
        else:
            logging.basicConfig(
                format=logformat,
                datefmt=datefmt,
                level=loglevel)
            
        logger.info("Initializing HUD-Alarm")

        # Single Database connection across all handlers
        self.database = DatabaseUtils.AlarmDatabase(config['database'])

def main():
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.current().start()

if __name__ == '__main__':
    main()