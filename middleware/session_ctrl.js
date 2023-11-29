const logger = require('../util/log').getLogger();
const sessionModel = require('../service/session');

module.exports = async (ctx, next) => {
    const method = ctx.method.toUpperCase() || 'unknown-method';
    const ip = ctx.request.header['x-real-ip'] || 'unknown-ip-address';
    const sessionToken = ctx.cookies.get('session');
    const referrer = ctx.request.headers.referer || ctx.request.headers.referrer;
    const requestOrigin = ctx.request.headers.origin;
    const originUrl = ctx.request.originalUrl;

    logger.info(`Session-ctrl, ip:[${ip}]`);

    if (referrer && referrer.startsWith('http://localhost')) {
        logger.info(`Session-ctrl enable CORS for referrer: [${referrer}], ip:[${ip}]`);
        // 允许跨域访问的配置
        ctx.set('Access-Control-Allow-Origin', requestOrigin);
        ctx.set('Access-Control-Allow-Methods', 'GET, POST');
        ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        ctx.set('Access-Control-Allow-Credentials', 'true');
    }

    if (!sessionToken) {
        logger.warn(`Session-ctrl no cookie, ip:[${ip}]`);
        ctx.redirect(`/qzlogin?url=${encodeURIComponent(originUrl)}`);
        return;
    }
    const session = sessionModel.parseSessionToken(sessionToken);
    if (session.status !== 0) {
        logger.warn(`Session-ctrl session status:[session.status], ip:[${ip}]`);
        ctx.redirect(`/qzlogin?url=${encodeURIComponent(originUrl)}`);
        return;
    }
    logger.info(`Session-ctrl session visit, phone: ${session.phone}`);
    ctx.userSession = session.phone;

    if (method === 'POST') {
        logger.info(`Session-ctrl [${originUrl}] POST method params: [${JSON.stringify(ctx.request.body || {})}], ip:[${ip}]`);
    }
    else if (method === 'GET') {
        logger.info(`Session-ctrl [${originUrl}] GET method, ip:[${ip}]`);
    }
    else if (method === 'OPTIONS') {
        logger.info(`Session-ctrl [${originUrl}] OPTIONS method, ip:[${ip}]`);
    }
    else {
        logger.warn(`unexpected session request, ip:[${ip}]`);
        ctx.status = 403;
        ctx.body = {
            status: {
                code: 1009,
                msg: 'method should be post'
            }
        };
        return;
    }

    await next();
}