haraka-alias-forward
====================
# Introduction
This [Haraka](http://haraka.github.io/) plugin forwards emails received to addresses specified in the special aliases file. It doesn't set relay flag as the original implementation, but calls send_email method instead.

It doesn't change the behaviour of incoming email by default, so it can be used in conjunction with other plugins. If no other rcpt_to plugins runs after this to accept the email, it will be rejected. 

However, if you want to setup a forward only mail server and not trying to deliver the incoming email, do the following:
   
1. set `accept_when_match `and `discard_income_mail` to true.
2. Enable `queue/discard` plugin. 

Alternatively, you can use the provided `queue/skip` plugin and *discard_income_mail* flag is not needed

# Compatibility  
Tested with Haraka 2.8.4 and NodeJs 4.4.5

# Use
Put the plugins under *Haraka/plugins* directory and put the config file into *config* directory. If you installed Haraka globally using npm, do not put the plugin under the *plugin* folder you gave to `haraka -i <folder>`.

# Config
Example:
```json
{
    "accept_when_match" : true,
    "discard_income_mail" : true,
    "alias": {
        "example.com": [
            {
                "__DESCRIPTION__": " Email sent to any address starts with test under example.com will be forwarded to test@foo.com and QA@foo.com",
                "local_name": "test.*",
                "forward_to": [
                    "test@foo.com",
                    "QA@foo.com"
                ]
            },
            {
                "__DESCRIPTION__": "Email sent to any other email address (if not start with test, as the setting above) under example.com will be forwarded to support@foo.com", 
                "local_name": "*",
                "forward_to": "support@foo.com"
            }
        ]
    }
}
```

### accept_when_match
Indicates if plugin will accept the inbound email when it found a valid entry in the alias config. 
If set to false, you need to use other `rcpt_to` hooks/plugins to accept the email, if it's the last rcpt_to hook, a failure will be reported to sender.

### discard_income_mail
Whether should the plugin mark the incoming email as discard. If set to true, then use in conjunction with `queue/discard` plugin to discard email

### alias
Forward configuration for hosts. It may contain multiple name - value pairs. Each **key** is the domain part of the recipient, and **value** is an array of forward rules under that domain.

#### forward rules
This object provides forward configuration of that domain, by using `local_name` to match the *local part* of email address. The rules are evaluated in sequence and the first matching rule takes effect. 

It has the following properties:

- local_name - used to match the rule with the local part of an the email address, it could be:
    - asterisk (*) - Indicates it matches all email addresses under that domain.
    - regular expression - it is used to match the local part.
- disable - Optional, set to true if the address is disabled (discarded), so the inbound email will not be forwarded, and the email will not be accepted / discarded by this plugin disregards the setting of `accept_when_match` and `discard_income_mail`.
- forward_to - String or array of strings - the email address(es) where will the inbound email be forwarded to. 

# Thanks
[somanyad](https://github.com/ruandao/somanyad-emailD), a mail forward service with web UI.