function timeDurationFormat(duration) {
    const raw = +duration;
    let output = '00:00:00';
    if (isNaN(raw)) {
        return output;
    }

    try {
        output = new Date(duration * 1000).toISOString().slice(11, 19);
    }
    catch (_) {}
    return output;
}
module.exports.timeDurationFormat = timeDurationFormat;