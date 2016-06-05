// skip queue and return successful

exports.register = function () {
    this.register_hook('queue','skip');
}

exports.skip = function (next, connection) {
    connection.loginfo(this, 'skip message');
    // Pretend we delivered the message
    return next(OK);
}