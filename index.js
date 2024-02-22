const Koa = require('koa');
const Router = require('@koa/router');
const render = require('koa-ejs');
const static = require('koa-static')
const favicon = require('koa-favicon')
const path = require('path');
const fs = require('fs');
const redis = require('./util/redis_promise');
// const db = require('./util/mysql_promise');
const logger = require('./util/log').getLogger();
const PORT = 8010;

const koaBodyMW = require('koa-body')({
    multipart: true,
    uploadDir: '.',
    formidable: {
        maxFileSize: Infinity
    }
});
const accessMW = require('./middleware/access.js');
const errorMW = require('./middleware/error.js');
const sessionMW = require('./middleware/session_ctrl.js');

// project conf init
// const projectConf = require('./conf/bootstrap.json');
// const PORT = projectConf.webserver_port || 8085;
// const STORE_PATH = path.resolve(process.cwd(), projectConf.store_path) || path.resolve(cwd, 'file_store');
// if (!fs.existsSync(STORE_PATH)) {
//     fs.mkdirSync(STORE_PATH);
// }

// koa framework init
const app = new Koa();
app.proxy = true;

app.use(accessMW);

// template engine init
render(app, {
    root: path.join(__dirname, 'page'),
    layout: 'base',
    viewExt: 'html',
    cache: process.env.prod ? true : false,
    debug: false,
});

// static file init
const staticPath = './static';
app.use(static(
    path.join(__dirname, staticPath)
));

app.use(favicon(__dirname + '/static/favicon.ico'));

const router = new Router();
router.get('/', require('./page/home/home.js'));
router.get('/seamless', require('./page/seamless/index.js'));
router.get('/seamless/signup', require('./page/login/login.js'));
router.get('/seamless/login', require('./page/login/login.js'));
router.get('/seamless/chat', sessionMW, require('./page/chat/chat.js'));
router.post('/seamless/completion', koaBodyMW, require('./page/seamless/completion.js'));
router.get('/seamless/llmchat', require('./page/llmchat/index.js'));

router.post('/seamless/sms_send', koaBodyMW, require('./api/user/sms_send.js'));
router.post('/seamless/sms_verify', koaBodyMW, require('./api/user/sms_verify.js'));


app.use(router.routes());
app.use(errorMW);

(async () => {
    // await db.getConn();
    await redis.connect();
    app.listen(PORT);
    logger.info(`seamless project listening ${PORT}`);
})();
