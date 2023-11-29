// 基本入门文档: https://help.aliyun.com/document_detail/32068.html
const OSS = require('ali-oss');
const fs = require('fs');
const logger = require('./log').getLogger();
const conf = require('../conf/aliyun_oss.json');

conf.timeout = 20 * 60 * 1000; // 20min
if (false) { // 因为用的sytx的 所以先不开internal了
    conf.internal = true;
    logger.info('oss internal mode');
}
else {
    logger.info('oss public mode');
}
const client = new OSS(conf);

exports.putObject = async (name, filepath) => {
    try {
        const { res } = await client.put(name, filepath);
        if (res.status === 200 && res.statusCode === 200) {
            logger.info(`oss put success, with name: [${name}], path: [${filepath}]`);
            return true;
        }
        else {
            logger.fatal(`oss put error, with name: [${name}], path: [${filepath}]`);
            return false;
        }
    } catch (err) {
        logger.fatal(`oss put error, with name: [${name}], path: [${filepath}], error: [${err.toString()}]`);
        return false;
    }
};

exports.getObject = async (name, outputFile) => {
    try {
        // const { res } = await client.get(name, outputFile, {});
        const result = await client.getStream(name);
        const isOk = await streamPromise(result.stream, outputFile);
        // if (res.status === 200 && res.statusCode === 200) {
        if (isOk) {
            logger.info(`oss get success, with name: [${name}], to path: [${outputFile}]`);
            return true;
        }
        else {
            logger.fatal(`oss get error, with name: [${name}], to path: [${outputFile}]`);
            return false;
        }
    } catch (err) {
        logger.fatal(`oss get error2, with name: [${name}], to path: [${outputFile}], error: [${err.toString()}]`);
        return false;
    }
};

// 分片上传文档： https://help.aliyun.com/document_detail/111268.html
exports.multipartUpload = async (name, filepath) => {
    try {
        const setSize = 10 * 1024 * 1024;
        let count = 0;
        let loop;
        let second = 0;
        let pShow;
        let speedShow;
        const progress = (percent, _checkpoint) => {
            pShow = (percent * 100).toFixed(2);
            count++;
            // console.log(_checkpoint); // 分片上传的断点信息。
        };
        // 上传计速
        loop = setInterval(() => {
            second++;
            speedShow = count * setSize;
            speedShow = speedShow / 1024;
            speedShow = speedShow / 1024;
            speedShow = speedShow / second;
            speedShow = speedShow.toFixed(2);
            process.stdout.write(`进度：${pShow}%, 上传速度：${speedShow}MB/s\r`);
        }, 1000);
        const { res } = await client.multipartUpload(name, filepath, {
            progress,
            partSize: setSize,
            parallel: 3
        });
        clearInterval(loop);
        process.stdout.write(`上传完成，上传速度：${speedShow}MB/s\n`);
        if (res.status === 200 && res.statusCode === 200) {
            logger.info(`oss mp success, with name: [${name}], path: [${filepath}]`);
            return true;
        }
        else {
            logger.fatal(`oss mp error, with name: [${name}], path: [${filepath}]`);
            return false;
        }
    } catch (err) {
        logger.fatal(`oss mp error, with name: [${name}], to path: [${filepath}], error: [${err.toString()}]`);
        return false;
    }
};

exports.getSignCdnUrl = function (name, timeout = 3600) {
    logger.info(`oss sign cdn url for name: [${name}]`);
    let url = client.signatureUrl(name, {
        expires: timeout,
        method: 'GET',
    });
    return cdnUrl(url);
};

exports.getPublicCdnUrl = async function (name) {
    logger.info(`oss generate public url for key: [${name}]`);
    let ret = await client.putACL(name, 'public-read');
    if (ret && ret.res && ret.res.status !== 200) {
        logger.error(`oss putACL failed, ${JSON.stringify(ret)}`);
        return false;
    }
    let url = client.getObjectUrl(name);
    return cdnUrl(url);
};

// 参考：https://help.aliyun.com/zh/oss/developer-reference/authorized-access-3
exports.getSTS = async function () {
    const { STS } = OSS;
    let sts = new STS({
        // 填写步骤1创建的RAM用户AccessKey。
        accessKeyId: conf.accessKeyId,
        accessKeySecret: conf.accessKeySecret
    });
    // roleArn填写步骤2获取的角色ARN，例如acs:ram::175708322470****:role/ramtest。
    // policy填写自定义权限策略，用于进一步限制STS临时访问凭证的权限。如果不指定Policy，则返回的STS临时访问凭证默认拥有指定角色的所有权限。
    // 临时访问凭证最后获得的权限是步骤4设置的角色权限和该Policy设置权限的交集。
    // expiration用于设置临时访问凭证有效时间单位为秒，最小值为900，最大值以当前角色设定的最大会话时间为准。本示例指定有效时间为3000秒。
    // sessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为sessiontest。
    const result = await sts.assumeRole('acs:ram::1014585629752302:role/lumososssts', ``, '3000', 'sessiontest');
    const output = {
        region: conf.region,
        bucket: conf.bucket,
        AccessKeyId: result.credentials.AccessKeyId,
        AccessKeySecret: result.credentials.AccessKeySecret,
        SecurityToken: result.credentials.SecurityToken,
        Expiration: result.credentials.Expiration
    };
    return output;
};

function cdnUrl(url) {
    url = url.replace(/https?:\/\/suoyoutongxue\.oss-cn-hangzhou-internal\.aliyuncs\.com/, 'https://cdn.suoyoutongxue.com');
    url = url.replace(/https?:\/\/suoyoutongxue\.oss-cn-hangzhou\.aliyuncs\.com/, 'https://cdn.suoyoutongxue.com');
    url = url.replace(/https?:\/\/oss-cn-hangzhou-internal\.aliyuncs\.com/, 'https://cdn.suoyoutongxue.com');
    url = url.replace(/https?:\/\/oss-cn-hangzhou\.aliyuncs\.com/, 'https://cdn.suoyoutongxue.com');
    return url;
}

function streamPromise(stream, filePath) {
    return new Promise(resolve => {
        const ws = fs.createWriteStream(filePath);
        stream.pipe(ws);
        ws.on('error', (err) => {
            logger.fatal('ws error', err);
            resolve(false);
        });
        ws.on('finish', () => {
            logger.info(`streamPromise pipe finish`);
            resolve(true);
        });
    });
}