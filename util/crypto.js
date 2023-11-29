const crypto = require('crypto');

const secret = '2WMuLu.f9My8cCAARrXhngqQ*8R24ump'; // 32char
const algorithm = 'aes-256-ctr';
const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);

function encrypt(text) {
    let randomStr = String(new Date().getTime());
    let iv = crypto.createHash('md5').update(randomStr).digest('hex').substring(0, 16);
    let cipher = crypto.createCipheriv(algorithm, key, Buffer.from(iv));
    let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    return {
        encrypted,
        iv,
    };
}

function decrypt(text, iv) {
    let decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv));
    return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
}

function encryptWithIv(text, iv) {
    let cipher = crypto.createCipheriv(algorithm, key, Buffer.from(iv));
    let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    return encrypted;
}

function generateRandomHash() {
    const randomStr = String(new Date().getTime());
    const hash = crypto.createHash('md5').update(randomStr).digest('hex').substring(0, 16);
    return hash;
}

module.exports = {
    encrypt,
    decrypt,
    encryptWithIv,
    generateRandomHash,
};