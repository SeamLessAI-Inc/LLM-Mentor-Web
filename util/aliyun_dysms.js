"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file is auto-generated, don't edit it
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
const dysmsapi20170525_1 = __importStar(require("@alicloud/dysmsapi20170525")), $Dysmsapi20170525 = dysmsapi20170525_1;
const $OpenApi = __importStar(require("@alicloud/openapi-client"));
const tea_util_1 = __importStar(require("@alicloud/tea-util")), $Util = tea_util_1;

const conf = require('../conf/aliyun_dysms.json');
const logger = require('./log').getLogger();

class Client {
    /**
     * 使用AK&SK初始化账号Client
     * @param accessKeyId
     * @param accessKeySecret
     * @return Client
     * @throws Exception
     */
    static createClient(accessKeyId, accessKeySecret) {
        let config = new $OpenApi.Config({
            // 必填，您的 AccessKey ID
            accessKeyId: accessKeyId,
            // 必填，您的 AccessKey Secret
            accessKeySecret: accessKeySecret,
        });
        // 访问的域名
        config.endpoint = `dysmsapi.aliyuncs.com`;
        const inst = new dysmsapi20170525_1.default(config);
        logger.info('dysms init');
        return inst;
    }
    /**
    * 使用STS鉴权方式初始化账号Client，推荐此方式。
    * @param accessKeyId
    * @param accessKeySecret
    * @param securityToken
    * @return Client
    * @throws Exception
    */
    static createClientWithSTS(accessKeyId, accessKeySecret, securityToken) {
        let config = new $OpenApi.Config({
            // 必填，您的 AccessKey ID
            accessKeyId: accessKeyId,
            // 必填，您的 AccessKey Secret
            accessKeySecret: accessKeySecret,
            // 必填，您的 Security Token
            securityToken: securityToken,
            // 必填，表明使用 STS 方式
            type: "sts",
        });
        // 访问的域名
        config.endpoint = `dysmsapi.aliyuncs.com`;
        return new dysmsapi20170525_1.default(config);
    }
    static async sendVerifyCode(vCode, phone) {
        logger.info(`dysms sdk send code [${vCode}], to phone number: [${phone}]`);

        let client = Client.createClient(conf.accessKeyId, conf.accessKeySecret);
        let sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
            signName: conf.signName,
            templateCode: conf.templateCode,
            phoneNumbers: phone,
            templateParam: `{\"code\":\"${vCode}\"}`,
        });
        let runtime = new $Util.RuntimeOptions({});
        let resp = await client.sendSmsWithOptions(sendSmsRequest, runtime);
        if (resp.statusCode === 200 && resp.body.code === 'OK') {
            logger.info(`dysms sdk success, response body [${JSON.stringify(resp.body)}]`);
            return true;
        }
        else {
            logger.info(`dysms sdk fail, response [${JSON.stringify(resp)}]`);
            return false;
        }
    }
}
module.exports = Client;



