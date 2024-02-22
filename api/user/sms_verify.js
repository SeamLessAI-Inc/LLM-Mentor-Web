const redis = require('../../util/redis_promise');
const validFactory = require('../../util/param_validate');
const sessionModel = require('../../service/session');
const logger = require('../../util/log').getLogger();
const mobileConfig = require('../../conf/mobile.json');

const validate = validFactory([
  {
    name: 'ref',
    type: 'string',
  },
  {
    name: 'code',
    type: 'string',
  },
]);

module.exports = async (ctx, next) => {
  const param = ctx.request.body;
  const isValid = validate(param);
  if (!isValid) {
    logger.warn('sms_verify param invalid');
    ctx.body = {
      status: {
        code: 1001,
        msg: 'param invalid'
      }
    };
    return;
  }

  // 验证 code 正确性
  const redisData = await redis.get({
    key: `_SeamLess_sms_${param.ref}`,
  });
  if (redisData === false) {
    logger.error('sms_verify redis error');
    ctx.body = {
      status: {
        code: 1011,
        msg: 'code verify failed'
      }
    };
    return;
  }
  let verifyInfo = {};
  try {
    verifyInfo = JSON.parse(redisData)
  }
  catch (_) {
    logger.error(`sms_verify verifyInfo JSON.parse error: ${redisData}`);
    ctx.body = {
      status: {
        code: 1004,
        msg: 'internal error'
      }
    };
    return;
  }
  if (verifyInfo === null) {
    logger.warn(`sms_verify sms code overtime`);
    ctx.body = {
      status: {
        code: 1019,
        msg: 'sms code overtime'
      }
    };
    return;
  }
  if (verifyInfo.code !== param.code) {
    logger.warn(`sms_verify sms code wrong`);
    ctx.body = {
      status: {
        code: 1012,
        msg: 'code verify failed'
      }
    };
    return;
  }

  if (!mobileConfig.authorized.includes(verifyInfo.phone)) {
    logger.warn(`sms_verify unauthorized phone ${verifyInfo.phone}`);
    ctx.body = {
      status: {
        code: 1013,
        msg: 'code verify failed'
      }
    };
    return;
  }

  const token = sessionModel.getSessionToken(verifyInfo.phone);

  logger.info(`sms_verify output token for user: ${verifyInfo.phone}`);
  ctx.status = 200;
  ctx.body = {
    status: {
      code: 0,
      msg: 'ok'
    },
    data: {
      token,
    }
  };
};
