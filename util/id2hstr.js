const { encrypt, decrypt } = require('./crypto');

function parseHstr(hstr) {
    const objStr = decrypt(hstr.slice(16), hstr.slice(0,16));
    let obj = {};
    try {
        obj = JSON.parse(objStr);
    }
    catch (_) {
        return 0; // 表示解析 id 失败
    }
    if (obj.i) {
        return obj.i;
    }
    else {
        return 0;
    }
}

function encodeId(id) {
    let obj = {
        n: generateRandomString(10), // nounce (str)
        i: id, // id (num)
    };
    let hstrObj = JSON.stringify(obj);
    hstrObj = encrypt(String(hstrObj));
    return `${hstrObj.iv}${hstrObj.encrypted}`;
}

function generateRandomString(length) {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = {
    parseHstr,
    encodeId,
    generateRandomString,
};