const crypto = require('../util/crypto');
const TOKEN_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7天过期
const ADMIN_TOKEN_EXPIRE = 2 * 24 * 60 * 60 * 1000; // 2天过期

module.exports.getSessionToken = function getAdminSessionToken(phone) {
  const session = {
    phone,
    signin_timestamp: new Date().getTime(),
  };
  const sessionCipher = crypto.encrypt(JSON.stringify(session));
  const token = `${sessionCipher.iv}-${sessionCipher.encrypted}`;
  return token;
};

/**
 * @param string token
 * @returns {Object} An object with status and data properties.
 * @property {number} status - 0表示token正确 1,2,3,4表示token格式不合法 5表示token过期
 * @property {number} [phone] 仅当status=0|4|5 时才存在
 */
module.exports.parseSessionToken = function parseAdminSessionToken(token) {
  if (!/[0-9|a-f]{16}-[0-9|a-f]+/.test(token)) {
    return {
      status: 1
    };
  }

  const params = token.split('-');
  const iv = params[0];
  const cipher = params[1];
  const jsonStr = crypto.decrypt(cipher, iv);
  let jsonObj = {};
  try {
    jsonObj = JSON.parse(jsonStr);
  }
  catch (_) {
    return {
      status: 2
    };
  }

  const phone = jsonObj['phone'];
  const signinTime = jsonObj['signin_timestamp'];
  if (!phone || !signinTime) {
    return {
      status: 3
    };
  }

  const now = Date.now();
  if (now - signinTime < 0) {
    return {
      status: 4,
      phone,
    };
  }

  if (now - signinTime > ADMIN_TOKEN_EXPIRE) {
    return {
      status: 5,
      phone,
    };
  }

  return {
    status: 0,
    phone,
  };
};