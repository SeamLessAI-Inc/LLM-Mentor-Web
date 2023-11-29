const logger = require('../util/log').getLogger();

module.exports = async (ctx, next) => {
    const ip = ctx.request.header['x-real-ip'] || 'unknown-ip-address';
    const ua = ctx.request.header['user-agent'] || 'unknown-device';
    const method = ctx.method.toUpperCase() || 'unknown-method';

    if (method === 'GET') {
        logger.info(`access http GET method params: [${JSON.stringify(ctx.query)}] from ip: [${ip}] url: [${ctx.request.originalUrl}], device: [${ua}]`);
    }
    else if (method === 'POST') {
        logger.info(`access http POST method from ip: [${ip}] url: [${ctx.request.originalUrl}], device: [${ua}]`);
    }
    else {
        logger.info(`access http ${method}-method from ip: [${ip}] url: [${ctx.request.originalUrl}], device: [${ua}]`);
    }

    // logger.debug(`access header ${JSON.stringify(ctx.cookies.request.rawHeaders, null, 2)}`);

    await next();
}