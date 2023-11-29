
module.exports = async (ctx, next) => {
    ctx.state.pageTitle = 'seamless branding page';
    await ctx.render('seamless/index', {}, { layout: false });
};