const path = require('path');
const log4js = require('log4js');

log4js.configure({
    appenders: {
        running: {
            type: 'file',
            filename: path.resolve(process.cwd(), 'log/running.log')
        },
    },
    categories: {
        default: {
            appenders: ['running'], level: 'debug'
        }
    }
});

const logger = log4js.getLogger('running');

const loggerExport = {
    fatal(msg) {
        logger.fatal(msg);
        console.error(msg);
    },
    error(msg) {
        logger.error(msg);
        console.error(msg);
    },
    warn(msg) {
        logger.warn(msg);
        console.warn(msg);
    },
    info(msg) {
        logger.info(msg);
        console.info(msg);
    },
    debug(msg) {
        logger.debug(msg);
        console.log(msg);
    },
};

if (process.env.prod) {
    loggerExport.debug = () => {};
    loggerExport.info = (msg) => {
        logger.info(msg);
    };
    loggerExport.warn = (msg) => {
        logger.warn(msg);
    };
    loggerExport.error = (msg) => {
        logger.error(msg);
    };
    loggerExport.fatal = (msg) => {
        logger.fatal(msg);
    };
}

module.exports.getLogger = () => {
    return loggerExport;
};