
module.exports = async (ctx, next) => {
    ctx.state.pageTitle = 'seamless sign up';
    await ctx.render('login/login', {}, { layout: false });
};