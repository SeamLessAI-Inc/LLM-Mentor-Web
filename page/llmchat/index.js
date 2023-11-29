
module.exports = async (ctx, next) => {
    ctx.state.pageTitle = 'seamless chat page';
    await ctx.render('llmchat/index', {}, { layout: false });
};