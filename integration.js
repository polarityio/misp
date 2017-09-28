'use strict';

let request = require('request');
let _ = require('lodash');
let util = require('util');
let async = require('async');
let log = null;


function startup(logger){
    log = logger;
}

function doLookup(entities, options, cb) {

    let lookupResults = [];


    async.each(entities, function (entityObj, next) {
        if (entityObj.isIPv4 || entityObj.isIPv6 && options.lookupIPs)
        {
            _lookupEntity(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.trace({result: result}, "Result Values:");
                    next(null);
                }
            });
        } else if (entityObj.isMD5 && options.lookupMD5)
        {
            _lookupEntityMD5(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.trace({result: result}, "Result Values:");
                    next(null);
                }
            });
        }else if (entityObj.isSHA1 && options.lookupSHA1)
        {
            _lookupEntitySHA1(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.trace({result: result}, "Result Values:");
                    next(null);
                }
            });
        } else if (entityObj.isSHA256 && options.lookupSHA256)
        {
            _lookupEntitySHA256(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.trace({result: result}, "Result Values:");
                    next(null);
                }
            });
        }else if (entityObj.isDomain && options.lookupDomain)
        {
            _lookupEntityDomain(entityObj, options, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    lookupResults.push(result); log.trace({result: result}, "Result Values:");
                    next(null);
                }
            });
        }else {
            lookupResults.push({entity: entityObj, data: null}); //Cache the missed results
            next(null);
        }
    }, function (err) {
        cb(err, lookupResults);
    });
}


function _lookupEntity(entityObj, options, cb) {

    //Uncomment out this line if there are cert issues and MISP will work
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let uri = "https://" + options.uri + "/attributes/search/" + entityObj.value.toLowerCase();
    let url = 'https://' + options.uri + '/events/';

    if(entityObj.value)
        request({
            uri: 'https://' + options.uri + '/events/restSearch/download',
            method: 'POST',
            headers: {
                'Authorization': options.apiKey,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: {
                "request": {
                    "value": entityObj.value.toLowerCase()
                }
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(null, {
                    entity: entityObj,
                    data: null
                });
                log.error({err:err}, "Logging error");
                return;
            }

            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Domain Tools server was unable to process your request", null, '500', '2A', 'Unable to Process Request', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("You have exceeded your service level limits, please check Domain Tools for account information ", null, '503', '2A', 'Service limits reached', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
                cb(_createJsonErrorPayload("No information available for request", null, '404', '2A', 'No Information', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 206){
                cb(_createJsonErrorPayload("Unable to parse request", null, '206', '2A', 'Parse Error', {
                    err: err
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }


            log.debug({body: body}, "Body Object:");

            if(_.isNull(body.response) || typeof(body.response) === "undefined" || body.response.length == 0 ){
                return;
            }

            let bodyObjects = body.response;

            let resultArray = [];
            let summary = [];
            bodyObjects.forEach(function(obj){
                let matches =  _.find(obj.Event.Attribute, function(a) { return a.value === entityObj.value.toLowerCase()});
                let summary_tags = "Event ID: " + obj.Event.id
                resultArray.push(matches);
                summary.push(summary_tags);
            });


            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: summary,
                    // Data that you want to pass back to the notification window details block
                    details: {
                        body: bodyObjects,
                        attributes: resultArray,
                        uri: uri
                    }
                }
            });
        });
}

function _lookupEntityDomain(entityObj, options, cb) {

    //Uncomment out this line if there are cert issues and MISP will work
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let uri = "https://" + options.uri + "/attributes/search/" + entityObj.value.toLowerCase();
    let url = 'https://' + options.uri + '/events/';

    if(entityObj.value)
        request({
            uri: 'https://' + options.uri + '/events/restSearch/download',
            method: 'POST',
            headers: {
                'Authorization': options.apiKey,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: {
                "request": {
                    "value": entityObj.value.toLowerCase()
                }
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(null, {
                    entity: entityObj,
                    data: null
                });
                log.error({err:err}, "Logging error");
                return;
            }

            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Domain Tools server was unable to process your request", null, '500', '2A', 'Unable to Process Request', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("You have exceeded your service level limits, please check Domain Tools for account information ", null, '503', '2A', 'Service limits reached', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
                cb(_createJsonErrorPayload("No information available for request", null, '404', '2A', 'No Information', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 206){
                cb(_createJsonErrorPayload("Unable to parse request", null, '206', '2A', 'Parse Error', {
                    err: err
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }


            log.trace({body: body}, "Body Object:");

            if(_.isNull(body.response) || typeof(body.response) === "undefined" || body.response.length == 0 ){
                return;
            }

            let bodyObjects = body.response;


            let resultArray = [];
            let summary = [];
            bodyObjects.forEach(function(obj){
                let matches =  _.find(obj.Event.Attribute, function(a) { return a.value === entityObj.value.toLowerCase()});
                let summary_tags = "Event ID: " + obj.Event.id
                resultArray.push(matches);
                summary.push(summary_tags);
            });


            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: summary,
                    // Data that you want to pass back to the notification window details block
                    details: {
                        body: bodyObjects,
                        attributes: resultArray,
                        uri: uri
                    }
                }
            });
        });
}

function _lookupEntitySHA1(entityObj, options, cb) {

    //Uncomment out this line if there are cert issues and MISP will work
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let uri = "https://" + options.uri + "/attributes/search/" + entityObj.value.toLowerCase();
    let url = 'https://' + options.uri + '/events/';

    if(entityObj.value)
        request({
            uri: 'https://' + options.uri + '/events/restSearch/download',
            method: 'POST',
            headers: {
                'Authorization': options.apiKey,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: {
                "request": {
                    "value": entityObj.value.toLowerCase()
                }
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(null, {
                    entity: entityObj,
                    data: null
                });
                log.error({err:err}, "Logging error");
                return;
            }

            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Domain Tools server was unable to process your request", null, '500', '2A', 'Unable to Process Request', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("You have exceeded your service level limits, please check Domain Tools for account information ", null, '503', '2A', 'Service limits reached', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
                cb(_createJsonErrorPayload("No information available for request", null, '404', '2A', 'No Information', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 206){
                cb(_createJsonErrorPayload("Unable to parse request", null, '206', '2A', 'Parse Error', {
                    err: err
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }


            log.trace({body: body}, "Body Object:");

            if(_.isNull(body.response) || typeof(body.response) === "undefined" || body.response.length == 0 ){
                return;
            }

            let bodyObjects = body.response;


            let resultArray = [];
            let summary = [];
            bodyObjects.forEach(function(obj){
                let matches =  _.find(obj.Event.Attribute, function(a) { return a.value === entityObj.value.toLowerCase()});
                let summary_tags = "Event ID: " + obj.Event.id
                resultArray.push(matches);
                summary.push(summary_tags);
            });


            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: summary,
                    // Data that you want to pass back to the notification window details block
                    details: {
                        body: bodyObjects,
                        attributes: resultArray,
                        uri: uri
                    }
                }
            });
        });
}

function _lookupEntitySHA256(entityObj, options, cb) {

    //Uncomment out this line if there are cert issues and MISP will work
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let uri = "https://" + options.uri + "/attributes/search/" + entityObj.value.toLowerCase();
    let url = 'https://' + options.uri + '/events/';

    if(entityObj.value)
        request({
            uri: 'https://' + options.uri + '/events/restSearch/download',
            method: 'POST',
            headers: {
                'Authorization': options.apiKey,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: {
                "request": {
                    "value": entityObj.value.toLowerCase()
                }
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(null, {
                    entity: entityObj,
                    data: null
                });
                log.error({err:err}, "Logging error");
                return;
            }

            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Domain Tools server was unable to process your request", null, '500', '2A', 'Unable to Process Request', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("You have exceeded your service level limits, please check Domain Tools for account information ", null, '503', '2A', 'Service limits reached', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
                cb(_createJsonErrorPayload("No information available for request", null, '404', '2A', 'No Information', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 206){
                cb(_createJsonErrorPayload("Unable to parse request", null, '206', '2A', 'Parse Error', {
                    err: err
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }


            log.trace({body: body}, "Body Object:");

            if(_.isNull(body.response) || typeof(body.response) === "undefined" || body.response.length == 0 ){
                return;
            }

            let bodyObjects = body.response;


            let resultArray = [];
            let summary = [];
            bodyObjects.forEach(function(obj){
                let matches =  _.find(obj.Event.Attribute, function(a) { return a.value === entityObj.value.toLowerCase()});
                let summary_tags = "Event ID: " + obj.Event.id
                resultArray.push(matches);
                summary.push(summary_tags);
            });


            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: summary,
                    // Data that you want to pass back to the notification window details block
                    details: {
                        body: bodyObjects,
                        attributes: resultArray,
                        uri: uri
                    }
                }
            });
        });
}

function _lookupEntityMD5(entityObj, options, cb) {

    //Uncomment out this line if there are cert issues and MISP will work
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let uri = "https://" + options.uri + "/attributes/search/" + entityObj.value.toLowerCase();
    let url = 'https://' + options.uri + '/events/';

    if(entityObj.value)
        request({
            uri: 'https://' + options.uri + '/events/restSearch/download',
            method: 'POST',
            headers: {
                'Authorization': options.apiKey,
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: {
                "request": {
                    "value": entityObj.value.toLowerCase()
                }
            },
            json: true
        }, function (err, response, body) {
            if (err) {
                cb(null, {
                    entity: entityObj,
                    data: null
                });
                log.error({err:err}, "Logging error");
                return;
            }

            if(response.statusCode === 500){
                cb(_createJsonErrorPayload("Domain Tools server was unable to process your request", null, '500', '2A', 'Unable to Process Request', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 503){
                cb(_createJsonErrorPayload("You have exceeded your service level limits, please check Domain Tools for account information ", null, '503', '2A', 'Service limits reached', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 404){
                cb(_createJsonErrorPayload("No information available for request", null, '404', '2A', 'No Information', {
                    err: err
                }));
                return;
            }

            if(response.statusCode === 206){
                cb(_createJsonErrorPayload("Unable to parse request", null, '206', '2A', 'Parse Error', {
                    err: err
                }));
                return;
            }

            if (response.statusCode !== 200) {
                cb(body);
                return;
            }


            log.trace({body: body}, "Body Object:");

            if(_.isNull(body.response) || typeof(body.response) === "undefined" || body.response.length == 0 ){
                return;
            }

            let bodyObjects = body.response;


            let resultArray = [];
            let summary = [];
            bodyObjects.forEach(function(obj){
                let matches =  _.find(obj.Event.Attribute, function(a) { return a.value === entityObj.value.toLowerCase()});
                let summary_tags = "Event ID: " + obj.Event.id
                resultArray.push(matches);
                summary.push(summary_tags);
            });


            // The lookup results returned is an array of lookup objects with the following format
            cb(null, {
                // Required: This is the entity object passed into the integration doLookup method
                entity: entityObj,
                // Required: An object containing everything you want passed to the template
                data: {
                    // Required: this is the string value that is displayed in the template
                    entity_name: entityObj.value,
                    // Required: These are the tags that are displayed in your template
                    summary: summary,
                    // Data that you want to pass back to the notification window details block
                    details: {
                        body: bodyObjects,
                        attributes: resultArray,
                        uri: uri
                    }
                }
            });
        });
}
function validateOptions(userOptions, cb) {
    let errors = [];
    if(typeof userOptions.apiKey.value !== 'string' ||
        (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)){
        errors.push({
            key: 'apiKey',
            message: 'You must provide your MISP API key'
        })
    }

    if(typeof userOptions.uri.value !== 'string' ||
        (typeof userOptions.uri.value === 'string' && userOptions.uri.value.length === 0)){
        errors.push({
            key: 'uri',
            message: 'You must provide a valide url for MISP'
        })
    }

    cb(null, errors);
}

// function that takes the ErrorObject and passes the error message to the notification window
var _createJsonErrorPayload = function (msg, pointer, httpCode, code, title, meta) {
    return {
        errors: [
            _createJsonErrorObject(msg, pointer, httpCode, code, title, meta)
        ]
    }
};

// function that creates the Json object to be passed to the payload
var _createJsonErrorObject = function (msg, pointer, httpCode, code, title, meta) {
    let error = {
        detail: msg,
        status: httpCode.toString(),
        title: title,
        code: 'MISP_' + code.toString()
    };

    if (pointer) {
        error.source = {
            pointer: pointer
        };
    }

    if (meta) {
        error.meta = meta;
    }

    return error;
};

module.exports = {
    doLookup: doLookup,
    startup: startup,
    validateOptions: validateOptions
};