const logger = require('../util/log').getLogger();

module.exports = async (ctx, next) => {
    const ip = ctx.request.header['x-real-ip'] || 'unknown-ip-address';
    const ua = ctx.request.header['user-agent'] || 'unknown-device';
    logger.fatal(`error upstream, device: [${ua}] from ip: [${ip}] url: [${ctx.request.originalUrl}]`);

    ctx.status = 500;
    ctx.body = {
        status: {
            code: 1009,
            msg: 'internal error'
        }
    };
}