var util = require('util');
var Address = require('address-rfc2821').Address;
var outbound = require('./outbound');
var constants = require('haraka-constants');
var Transaction = require('./transaction');
var logger = require('./logger');

exports.register = function () {
    this.register_hook('rcpt', 'alias_forword');
};

exports.alias_forword = function (next, connection, params) {
    logger.logdebug('New Email arrived, RCPT_TO: ' + connection.transaction.rcpt_to);
    var config = this.config.get('rcpt_to.alias_forward', 'json') || {};
    var rcpt = params[0];
    var forward_addresses = find_forward_addresses(config.alias, rcpt);
    if (forward_addresses) {
        forward_message(connection.transaction, forward_addresses);
        if(config.discard_income_mail){
            connection.transaction.notes.discard = true;
        }
        if(config.accept_when_match){
            return next(OK);
        }
    }
    return next();
};

function find_forward_addresses(config, rcpt){
    logger.logdebug('Looking for forward address of original ', rcpt.original);
    var local_part = rcpt.user;
    var domain_part = rcpt.host;

    var domain_config = config[domain_part];
    if (domain_config) {
        for(var index in domain_config){
            var local_config = domain_config[index];
            if(local_part_match(local_config.local_name, local_part)){
                logger.logdebug('Found match, original: ', rcpt.original, '. Forward config: ', local_config);
                if(local_config.disable || !local_config.forward_to){
                    return undefined;
                } else {
                    return convert_to_array_if_not(local_config.forward_to);
                }
            }
        }
    }
    return undefined;
};

function local_part_match(local_config, local_part){
    // Asterisk should match all email addresses of same domain, or the local config match exactly the local part
    var match = local_config === '*' || local_config === local_part;

    // Then, use regular expression check
    if (!match) {
        try {
            var local_config_regex = new RegExp(local_config, 'i');
            match = local_config_regex.test(local_part);
        } catch(err){
            logger.logwarn('Error for name ' + local_config + ': ' + err);
        }
    }
    return match;
};

function forward_message (originalTransaction, recipients) {
    var send_transaction = Transaction.createTransaction();
    Object.assign(send_transaction, originalTransaction);
    send_transaction.rcpt_to = [];
    convert_to_array_if_not(recipients).forEach(function (recipient) {
        send_transaction.rcpt_to.push(new Address('<' + recipient + '>'));
    });
    outbound.send_email(send_transaction, function(retval, msg) {
        switch(retval) {
            case constants.ok:
                logger.logdebug('Successful forwarded, original: ' + originalTransaction.rcpt_to.original + ', to: ' + recipients);
                break;
            case constants.deny:
            default:
                logger.logwarn('Failed to forward, original: ' + originalTransaction.rcpt_to.original + ', to: ' + recipients + '. Status: ' + retval + '. Message: ' + msg);
        }
    });
};

function convert_to_array_if_not(obj){
    if (!util.isArray(obj)) {
        obj = [obj];
    }
    return obj;
};