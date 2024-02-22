const sessionModel = require('../../service/session');

module.exports = async (ctx, next) => {
    ctx.state.pageTitle = 'seamless branding page';

    const sessionToken = ctx.cookies.get('session');
    if (!sessionToken) {
        await ctx.render('home/home', {
            isLogin: false
        }, { layout: false });
        return;
    }

    const session = sessionModel.parseSessionToken(sessionToken);
    if (session.status !== 0) {
        await ctx.render('home/home', {
            isLogin: false
        }, { layout: false });
        return;
    }

    ctx.userSession = session.phone;
    await ctx.render('home/home', {
        isLogin: true,
        phone: session.phone
    }, { layout: false });
};