module.exports = {
    "name": "Malware Information and Sharing Platform",
    "acronym":"MISP",
    "logging": { level: 'debug'},
    "description": "MISP threat intelligence platform",
    "entityTypes": ['domain', 'IPv4', 'IPv6', 'hash'],
    "styles":[
        "./styles/misp.less"
    ],
    "block": {
        "component": {
            "file": "./components/misp.js"
        },
        "template": {
            "file": "./templates/misp.hbs"
        }
    },
    "options":[
        {
            "key"         : "apiKey",
            "name"        : "Authentication Key",
            "description" : "MISP API key",
            "type"        : "text",
            "userCanEdit" : false,
            "adminOnly"    : false
        },
        {
            "key"         : "uri",
            "name"        : "MISP URL",
            "description" : "URL of your MISP instance",
            "type"        : "text",
            "userCanEdit" : false,
            "adminOnly"    : false
        },
        {
            "key": "lookupIp",
            "name": "Lookup IPv4 and IPv6 Addresses",
            "description": "If checked, the integration will lookup IPv4 and IPv6 addresses",
            "default": true,
            "type": "boolean",
            "userCanEdit": true,
            "adminOnly": false
        },
        {
            "key": "lookupDomain",
            "name": "Lookup Domains",
            "description": "If checked, the integration will lookup domains",
            "default": true,
            "type": "boolean",
            "userCanEdit": true,
            "adminOnly": false
        },
        {
            "key": "lookupMD5",
            "name": "Lookup MD5 hashes",
            "description": "If checked, the integration will lookup MD5 hashes",
            "default": true,
            "type": "boolean",
            "userCanEdit": true,
            "adminOnly": false
        },
        {
            "key": "lookupSHA1",
            "name": "Lookup SHA1 hashes",
            "description": "If checked, the integration will lookup SHA1 hashes",
            "default": true,
            "type": "boolean",
            "userCanEdit": true,
            "adminOnly": false
        },
        {
            "key": "lookupSHA256",
            "name": "Lookup SHA256",
            "description": "If checked, the integration will lookup SHA256 hashes",
            "default": true,
            "type": "boolean",
            "userCanEdit": true,
            "adminOnly": false
        }

    ]
};