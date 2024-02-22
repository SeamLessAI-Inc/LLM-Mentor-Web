
module.exports = async (ctx, next) => {
    ctx.state.pageTitle = 'seamless mentor chat';
    await ctx.render('chat/chat', {}, { layout: false });
};