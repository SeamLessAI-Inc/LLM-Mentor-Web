const axios = require('axios');

module.exports = async (ctx, next) => {
    try {
        // const response = await axios.post('http://3.38.97.103:8000/v1/chat/completions', ctx.request.body);
        const response = await axios.post('http://3.38.97.103:7860/v1/chat/completions', ctx.request.body);
        ctx.body = response.data;
    } catch (error) {
        ctx.status = error.response ? error.response.status : 500;
        ctx.body = error.message;
    }
};