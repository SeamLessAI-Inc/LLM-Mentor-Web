const redis = require('../../util/redis_promise');
const validFactory = require('../../util/param_validate');
const sms = require('../../util/aliyun_dysms');
const logger = require('../../util/log').getLogger();
const crypto = require('../../util/crypto');

const validate = validFactory([
    {
        name: 'phone',
        type: 'string',
    },
]);

module.exports = async (ctx, next) => {
    const param = ctx.request.body;
    const isValid = validate(param);
    if (!isValid) {
        logger.warn('sms_send param invalid');
        ctx.body = {
            status: {
                code: 1001,
                msg: 'param invalid'
            }
        };
        return;
    }

    if (!/^1[3-9]{1}\d{9}$/.test(param.phone)) {
        logger.warn('sms_send phone number invalid');
        ctx.body = {
            status: {
                code: 1011,
                msg: 'phone number invalid'
            }
        };
        return;
    }

    let code = '';
    for (let i = 0; i < 4; i++) {
        code += Math.floor(Math.random() * 10);
    }
    logger.info(`sms_send phone ${param.phone} send code ${code}`);
    const smsRet = await sms.sendVerifyCode(code, param.phone);
    if (smsRet === false) {
        logger.warn('sms_send send phone code failed');
        ctx.body = {
            status: {
                code: 1020,
                msg: 'send phone code failed'
            }
        };
        return;
    }

    const ref = crypto.generateRandomHash();
    const referInfo = {
        code,
        phone: param.phone
    };

    const redisSuccess = await redis.setWithExpire({
        key: `_SeamLess_sms_${ref}`,
        value: JSON.stringify(referInfo),
        expire: 120
    });
    if (redisSuccess === false) {
        logger.error('sms_send redis error');
        ctx.body = {
            status: {
                code: 1004,
                msg: 'mdb error'
            }
        };
        return;
    }

    logger.info('sms_send output ref');
    ctx.status = 200;
    ctx.body = {
        status: {
            code: 0,
            msg: 'ok'
        },
        data: {
            ref,
        }
    };
};