const redis = require('redis');
const conf = require('../conf/redis.json');
const logger = require('./log').getLogger();

const tableNamePrefix = 'seamless::';
let clientInst = null;
let loop = null;
const HEART_PACK_INTERVAL = 30000;

module.exports.connect = function (option) {
    if (clientInst !== null) {
        return;
    }
    clientInst = redis.createClient({
        host: conf.host,
        port: conf.port,
        password: conf.password
    });
    logger.info('redis connected');
    loop = setInterval(() => {
        clientInst.ping((err, res) => {
            if (err !== null) {
                logger.fatal(`redis ping get error: ${err.toString()}`);
                clientInst = null; // 显式释放对象 避免内存泄漏？
                clientInst = redis.createClient(conf);
            }
            if (res !== 'PONG') {
                logger.fatal(`redis ping return not pong: ${res}`);
                clientInst = null; // 显式释放对象 避免内存泄漏？
                clientInst = redis.createClient(conf);
            }
        });
    }, HEART_PACK_INTERVAL);
    process.on('exit', function (){
        logger.info('redis connection destroy');
        clientInst.quit();
        clearInterval(loop);
    });
};

module.exports.quit = function () {
    logger.info('redis connect close');
    clientInst.quit();
};

module.exports.set = function (option) {
    return new Promise((resolve, reject) => {
        if (!option.key) {
            logger.fatal(`redis set with empty key`);
            resolve(false);
            return;
        }

        let key = tableNamePrefix + option.key;
        let value = option.value;
        if (!value) {
            logger.fatal(`redis set with empty value`);
            resolve(false);
            return;
        }

        clientInst.set(key, value, function (err, rel) {
            if (err === null) {
                logger.debug(`redis set key [${key}] response: ${rel}`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis set with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.setWithExpire = function (option) {
    return new Promise((resolve, reject) => {
        if (!option.key) {
            logger.fatal(`redis setWithExpire with empty key`);
            resolve(false);
            return;
        }

        let key = tableNamePrefix + option.key;
        let value = option.value;
        if (!value) {
            logger.fatal(`redis setWithExpire with empty value`);
            resolve(false);
            return;
        }

        if (!Number.isInteger(option.expire)) {
            logger.fatal(`redis setWithExpire invalid expire param ${option.expire}`);
            resolve(false);
            return;
        }

        clientInst.set(key, value, 'EX', option.expire, function (err, rel) {
            if (err === null) {
                logger.debug(`redis setWithExpire key [${key}] expire [${option.expire}] response: ${rel}`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis setWithExpire with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.get = function (option) {

    return new Promise((resolve, reject) => {
        if (!option.key) {
            logger.fatal(`redis get with empty key`);
            resolve(false);
            return;
        }

        const prefix = typeof option.keyPrefix === 'string' ? option.keyPrefix : tableNamePrefix;
        const key = prefix + option.key;

        logger.debug(`redis get key: ${key}`);
        clientInst.get(key, function (err, rel) {
            if (err === null) {
                logger.debug(`redis get: ${rel}`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis get with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.incr = function (option) {
    return new Promise((resolve, reject) => {
        if (!option.key) {
            logger.fatal(`redis incr with empty key`);
            resolve(false);
            return;
        }

        let key = tableNamePrefix + option.key;

        clientInst.incr(key, function (err, rel) {
            if (err === null) {
                logger.debug(`redis incr: ${rel}`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis incr with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.lpop = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.lpop(table, function (err, rel) {
            if (err === null) {
                logger.debug(`redis lpop: ${rel}`);
                try {
                    let output = JSON.parse(rel);
                    resolve(output);
                }
                catch (err) {
                    logger.error(`redis lpop json parse error: ${err}`);
                    resolve(false);
                }
            }
            else {
                logger.fatal(`redis lpop with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.llen = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.llen(table, function (err, rel) {
            if (err === null) {
                logger.debug(`redis llen: ${rel}`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis llen with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.lrange = function (option) {
    return new Promise((resolve, reject) => {
        const table = tableNamePrefix + option.tableName;
        const start = option.start || 0;
        const stop = option.stop || -1;
        clientInst.lrange(table, start, stop, function (err, rel) {
            if (err === null) {
                logger.debug(`redis lrange success`);
                const output = [];
                rel.forEach((item) => {
                    output.push(JSON.parse(item));
                });
                resolve(output);
            }
            else {
                logger.fatal(`redis lrange with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.rpush = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let input = JSON.stringify(option.value);
        clientInst.rpush(table, input, function (err, rel) {
            if (err === null) {
                logger.debug(`redis rpush successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis rpush with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.lset = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let index = Number(option.value.index);
        let value = String(option.value.value);

        if (isNaN(index)) {
            logger.fatal(`redis lset got invalid index: ${option.index}`);
            return;
        }

        if (value.length = 0) {
            logger.fatal(`redis lset got invalid value: ${option.value}`);
            return;
        }

        clientInst.lset(table, index, value, function (err, rel) {
            if (err === null) {
                logger.debug(`redis lset successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis lset with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.lrem = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let value = String(option.value.value);

        if (value.length = 0) {
            logger.fatal(`redis lrem got invalid value: ${option.value}`);
            return;
        }

        clientInst.lrem(table, -1, value, function (err, rel) {
            if (err === null) {
                logger.debug(`redis lrem successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis lrem with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.hget = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hget(table, option.key, function (err, rel) {
            if (err === null) {
                logger.debug(`redis hget: ${rel}`);
                try {
                    let output = JSON.parse(rel);
                    resolve(output);
                } catch (err) {
                    logger.error(`redis hget json parse error: ${err}`);
                    resolve(false);
                }
            }
            else {
                logger.fatal(`redis hget with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.hgetall = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hgetall(table, function (err, rel) {
            if (err === null) {
                logger.debug(`redis hgetall: ${rel}`);
                try {
                    let output = [];
                    for (let i in rel) {
                        output.push(JSON.parse(rel[i]));
                    }
                    resolve(output);
                } catch (err) {
                    logger.error(`redis hgetall json parse error: ${err}`);
                    resolve(false);
                }
            }
            else {
                logger.fatal(`redis hgetall with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.hset = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let input = JSON.stringify(option.value);
        clientInst.hset(table, option.key, input, function (err, rel) {
            if (err === null) {
                logger.debug(`redis hset successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis hset with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};

module.exports.hdel = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hdel(table, option.key, function (err, rel) {
            if (err === null) {
                logger.debug(`redis hdel successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis del with option ${option.toString()} error: ${err}`);
                resolve(false);
            }
        });
    });
};