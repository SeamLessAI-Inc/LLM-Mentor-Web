const mysql = require('mysql');
const confFile = require('../conf/mysql.json');
const logger = require('./log').getLogger();

let conf = {};
if (process.env.prod) {
    conf = confFile.prod;
    logger.info(`mysql prod env, host: ${conf.host}`);
}
else {
    conf = confFile.dev;
    logger.info(`mysql dev env, host: ${conf.host}`);
}

let connInst = null;
const loop = null;
const HEART_PACK_INTERVAL = 30000;

module.exports.getConn = () => {
    return new Promise(resolve => {
        if (connInst) {
            resolve(connInst);
            return;
        }

        if (process.env.sql) {
            conf.debug = true;
        }

        const conn = mysql.createConnection(conf);
        conn.connect();
        logger.info('mysql connected');

        const wrapConn = {};
        decoConnByPromise(wrapConn, conn, 'query');
        decoConnByPromise(wrapConn, conn, 'beginTransaction');
        decoConnByPromise(wrapConn, conn, 'commit');
        decoConnByPromise(wrapConn, conn, 'rollback');
        decoConnByPromise(wrapConn, conn, 'ping');
        decoConnByPromise(wrapConn, conn, 'end');
        wrapConn.escape = conn.escape;

        connInst = wrapConn;
        resolve(connInst);
        loop = setInterval(() => {
            connInst.ping((err, res) => {
                if (err !== null) {
                    logger.fatal(`mysql ping get error: ${err.toString()}`);
                    connInst = null; // 显式释放对象 避免内存泄漏？
                    connInst = mysql.createConnection(conf);
                }
            });
        }, HEART_PACK_INTERVAL);
        process.on('exit', function (){
            logger.info('mysql connection destroy');
            connInst.destroy();
            clearInterval(loop);
        });
    });
};

function decoConnByPromise(wrapObj, oriObj, method) {
    wrapObj[method] = function () {
        let args = arguments;
        if (method === 'query') {
            let [sql, ...params] = args;
            logger.debug(`db query with sql: [${sql}], params: [${JSON.stringify(params)}]`);
        }

        return new Promise(resolve => {
            oriObj[method](...args, function () {
                let [err, result, packInfo] = arguments;
                if (err !== null && err !== undefined) {
                    logger.fatal(`db query error: [${err.toString()}]`);
                    resolve(false);
                    return;
                }
                resolve(result, packInfo);
            });
        });
    };
}