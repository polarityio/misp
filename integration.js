'use strict';

const request = require('request');
const async = require('async');
const config = require('./config/config');
const fs = require('fs');
const TinyColor = require('@ctrl/tinycolor').TinyColor;

let TAGS_CACHE = [];
let CACHE_REFRESHED_TIME;
const CACHE_REFRESH_INTERVAL_IN_MS = 60 * 60 * 1000; //1 hour
const MAX_EVENTS_PER_ATTRIBUTE = 10;
const MAX_SUMMARY_TAGS = 5;
const THREAT_LEVELS = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
  4: 'undefined'
};

const ANALYSIS_LEVELS = {
  0: 'Initial',
  1: 'Ongoing',
  2: 'Complete'
};

const DISTRIBUTION_LEVELS = {
  0: 'Your organisation only',
  1: 'This community only',
  2: 'Connected communities',
  3: 'All communities'
};

let log = null;
let requestWithDefaults;

function startup(logger) {
  log = logger;

  let defaults = {};

  if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
    defaults.cert = fs.readFileSync(config.request.cert);
  }

  if (typeof config.request.key === 'string' && config.request.key.length > 0) {
    defaults.key = fs.readFileSync(config.request.key);
  }

  if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
    defaults.passphrase = config.request.passphrase;
  }

  if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
    defaults.ca = fs.readFileSync(config.request.ca);
  }

  if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
    defaults.proxy = config.request.proxy;
  }

  if (typeof config.request.rejectUnauthorized === 'boolean') {
    defaults.rejectUnauthorized = config.request.rejectUnauthorized;
  }

  requestWithDefaults = request.defaults(defaults);
}

function doLookup(entities, options, cb) {
  const lookupResults = [];

  log.trace(entities);

  async.each(
    entities,
    function (entityObj, next) {
      _lookupEntity(entityObj, options, function (err, result) {
        if (err) {
          next(err);
        } else {
          lookupResults.push(result);
          next(null);
        }
      });
    },
    function (err) {
      cb(err, lookupResults);
    }
  );
}

function onDetails(entityObj, options, cb) {
  log.trace({ details: entityObj.data.details }, 'Calling onDetails');
  async.each(
    entityObj.data.details,
    (attribute, next) => {
      _lookupEvent(attribute.Event.id, options, (error, event) => {
        if (error) {
          next(error);
        } else {
          log.debug({ event: event }, 'lookupEvent result');
          attribute.Event.details = event;
          next(null);
        }
      });
    },
    (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, entityObj.data);
    }
  );
}

function _shouldRefreshCache() {
  const currentTime = new Date().getTime();
  const timeDiffInMilliseconds = currentTime - CACHE_REFRESHED_TIME;
  if (timeDiffInMilliseconds >= CACHE_REFRESH_INTERVAL_IN_MS) {
    return true;
  }
  return false;
}

function _removeTagFromEvent(eventId, tagId, options, cb) {
  requestWithDefaults(
    {
      uri: `${options.uri}/events/removeTag`,
      method: 'POST',
      json: true,
      headers: {
        Authorization: options.apiKey
      },
      body: {
        request: {
          id: eventId,
          tag: tagId
        }
      }
    },
    (err, response, body) => {
      if (err) {
        return cb({
          detail: 'HTTP request error when removing tag(s) from event',
          err: err
        });
      }

      if (body.saved === true) {
        return cb(null, body);
      } else if (body.saved === false) {
        return cb({
          detail: body.errors
        });
      }

      const unexpectedResponseError = {
        detail: 'Unexpected response when removing tags from event',
        err: err,
        response: response
      };

      log.error(unexpectedResponseError);

      cb(unexpectedResponseError);
    }
  );
}

function _removeTagFromAttribute(attributeId, tagId, options, cb) {
  requestWithDefaults(
    {
      uri: `${options.uri}/attributes/removeTag/${attributeId}/${tagId}`,
      method: 'POST',
      json: true,
      headers: {
        Authorization: options.apiKey
      }
    },
    (err, response, body) => {
      if (err) {
        return cb({
          detail: 'HTTP request error when removing tag(s) from attribute',
          err: err
        });
      }

      if (body.saved === true) {
        return cb(null, body);
      } else if (body.saved === false) {
        return cb({
          detail: body.errors
        });
      }

      const unexpectedResponseError = {
        detail: 'Unexpected response when removing tags from attribute',
        err: err,
        response: response
      };

      log.error(unexpectedResponseError);

      cb(unexpectedResponseError);
    }
  );
}

function onMessage(payload, options, cb) {
  switch (payload.action) {
    case 'GET_TAGS':
      if (TAGS_CACHE.length > 0 && _shouldRefreshCache() === false) {
        return cb(null, TAGS_CACHE);
      }

      log.info('Refreshing Tags Cache');

      requestWithDefaults(
        {
          uri: `${options.uri}/tags`,
          method: 'GET',
          json: true,
          headers: {
            Authorization: options.apiKey
          }
        },
        (err, response, body) => {
          if (err) {
            return cb({
              detail: 'HTTP request error when retrieving tags',
              err: err
            });
          }

          if (body && Array.isArray(body.Tag)) {
            for (let tag of body.Tag) {
              tag.font_color = new TinyColor(tag.colour).isDark() ? '#ffffff' : '#000000';
            }
            TAGS_CACHE = body.Tag;
            CACHE_REFRESHED_TIME = new Date().getTime();
            return cb(null, body.Tag);
          }

          const unexpectedResponseError = {
            detail: 'Unexpected response when retrieving tags',
            err: err,
            response: response
          };

          log.error(unexpectedResponseError);

          return cb(unexpectedResponseError);
        }
      );
      break;
    case 'REMOVE_TAG_FROM_EVENT':
      if (options.enableRemovingTags === false) {
        return cb({
          detail: 'Tag removal is not enabled'
        });
      }

      log.info(payload, 'REMOVE_TAG_FROM_EVENT Payload');
      _removeTagFromEvent(payload.eventId, payload.tagId, options, cb);
      break;
    case 'REMOVE_TAG_FROM_ATTRIBUTE':
      if (options.enableRemovingTags === false) {
        return cb({
          detail: 'Tag removal is not enabled'
        });
      }

      log.info(payload, 'REMOVE_TAG_FROM_ATTRIBUTE Payload');
      _removeTagFromAttribute(payload.attributeId, payload.tagId, options, cb);
      break;
    case 'ADD_TAGS':
      if (options.enableAddingTags === false) {
        log.debug('Adding tags is disabled via options');
        return cb({
          detail: 'Adding tags is not enabled'
        });
      }

      const tagIds = payload.tags.map((tag) => {
        return tag.id;
      });

      log.debug({ payload: payload, tagIds }, 'Adding Tags');

      requestWithDefaults(
        {
          uri: `${options.uri}/events/addTag/${payload.eventId}`,
          method: 'POST',
          json: true,
          headers: {
            Authorization: options.apiKey
          },
          formData: {
            'data[Event][tag]': '[' + tagIds.toString() + ']'
          }
        },
        (err, response, body) => {
          if (err) {
            return cb({
              detail: 'HTTP request error when adding tag(s)',
              err: err
            });
          }

          if (body.saved === true) {
            return cb(null, body);
          }

          const unexpectedResponseError = {
            detail: 'Unexpected response when adding tags',
            err: err,
            response: response
          };

          log.error(unexpectedResponseError);

          return cb(unexpectedResponseError);
        }
      );

      break;
    default:
      cb({
        detail: "Invalid 'action' provided to onMessage function"
      });
  }
}

function _setTagFontColor(attributes) {
  for (let attribute of attributes) {
    if (Array.isArray(attribute.Tag)) {
      for (let tag of attribute.Tag) {
        tag.font_color = new TinyColor(tag.colour).isDark() ? '#ffffff' : '#000000';
      }
    }
  }
}

function _getSummaryTags(attributes) {
  const tags = new Set();
  for (let attribute of attributes) {
    if (typeof attribute.category === 'string' && attribute.category.length > 0) {
      tags.add(attribute.category);
    }
    if (Array.isArray(attribute.Tag)) {
      for (let tag of attribute.Tag) {
        tags.add(tag.name);
        if (tags.length >= MAX_SUMMARY_TAGS) {
          return [...tags];
        }
      }
    }
  }

  let tagList = [...tags];
  if (tagList.length === 0) {
    tagList.push('no summary data');
  }

  return tagList;
}

function _getAttributeSearchUri(options) {
  const uri = options.uri.endsWith('/') ? options.uri.slice(0, -1) : options.uri;
  return `${uri}/attributes/restSearch`;
}

function _getEventSearchUri(options) {
  const uri = options.uri.endsWith('/') ? options.uri.slice(0, -1) : options.uri;
  return `${uri}/events/index`;
}

function _getAttributeRequestOptions(entityObj, options) {
  const requestOptions = {
    uri: _getAttributeSearchUri(options),
    method: 'POST',
    headers: {
      Authorization: options.apiKey
    },
    body: {
      value: entityObj.value.toLowerCase(),
      limit: MAX_EVENTS_PER_ATTRIBUTE,
      includeEventTags: true
    },
    json: true
  };

  return requestOptions;
}

function _isMiss(body) {
  if (body.response.Attribute.length === 0) {
    return true;
  }
}

function _lookupEvent(eventId, options, cb) {
  const requestOptions = {
    uri: _getEventSearchUri(options),
    method: 'POST',
    headers: {
      Authorization: options.apiKey
    },
    body: {
      eventid: eventId,
      limit: 1
    },
    json: true
  };

  log.trace({ requestOptions: requestOptions }, 'Looking up event');

  requestWithDefaults(
    requestOptions,
    _handleRequestErrors(
      _validateEventPayload((error, response, body) => {
        log.debug({ body: body }, 'Event Body');
        if (error) {
          log.error({ error: error }, 'Error lookup up event');
          return cb(error);
        }
        // return payload is an array of event objects.  However, we are only ever returning a single
        // event so we simply return the first event
        const event = body[0];
        event.threat_level = THREAT_LEVELS[event.threat_level_id];
        event.analysis_level = ANALYSIS_LEVELS[event.analysis];
        event.distribution_level = DISTRIBUTION_LEVELS[event.distribution];
        cb(null, event);
      })
    )
  );
}

function _lookupEntity(entityObj, options, cb) {
  requestWithDefaults(
    _getAttributeRequestOptions(entityObj, options),
    _handleRequestErrors(
      _validateAttributePayload((error, response, body) => {
        if (error) {
          return cb(error);
        }

        if (_isMiss(body)) {
          return cb(null, {
            entity: entityObj,
            data: null
          });
        }

        log.debug({ body: body }, 'lookupEntity body result');

        _setTagFontColor(body.response.Attribute);

        // The lookup results returned is an array of lookup objects with the following format
        cb(null, {
          entity: entityObj,
          data: {
            summary: _getSummaryTags(body.response.Attribute),
            details: body.response.Attribute
          }
        });
      })
    )
  );
}

function _createinvalidBodyError(err, response, body) {
  return _createJsonErrorPayload('Unexpected response body', null, response.statusCode, '2A', 'Response Error', {
    err,
    response,
    body
  });
}

function _validateEventPayload(cb) {
  return (err, response, body) => {
    if (err) {
      return cb(err);
    }

    cb(err, response, body);
  };
}

function _validateAttributePayload(cb) {
  return (err, response, body) => {
    if (err) {
      return cb(err);
    }

    if (typeof body.response === 'undefined') {
      return cb(_createinvalidBodyError(err, response, body));
    }

    if (!Array.isArray(body.response.Attribute)) {
      return cb(_createinvalidBodyError(err, response, body));
    }

    cb(err, response, body);
  };
}

function _handleRequestErrors(cb) {
  return (err, response, body) => {
    log.trace({ err, body }, '_handleRequestErrors');
    if (err || typeof response === 'undefined' || typeof body === 'undefined') {
      return cb({
        detail: 'HTTP Request Error',
        response: _sanitizeResponse(response),
        body: body,
        err: err
      });
    }

    switch (response.statusCode) {
      case 500:
        return cb(
          _createJsonErrorPayload(
            'MISP was unable to process your lookup request',
            null,
            '500',
            '2A',
            'Unable to Process Request',
            { response, body, err }
          )
        );
      case 503:
        return cb(
          _createJsonErrorPayload(
            'You have exceeded your service level limits, please check MISP for account information ',
            null,
            '503',
            '2A',
            'Service limits reached',
            { response, body, err }
          )
        );
      case 404:
        return cb(
          _createJsonErrorPayload('No information available for request', null, '404', '2A', 'Entity Not Found', {
            err,
            response,
            body
          })
        );
      case 206:
        return cb(
          _createJsonErrorPayload('Unable to parse request', null, '206', '2A', 'Parse Error', {
            err,
            response,
            body
          })
        );
    }

    // catch all
    if (response.statusCode !== 200) {
      return cb(
        _createJsonErrorPayload('Unexpected HTTP Status Code', null, response.statusCode, '2A', 'HTTP Error', {
          err,
          response,
          body
        })
      );
    }

    // validate response format
    const invalidBodyError = _createJsonErrorPayload(
      'Unexpected response body',
      null,
      response.statusCode,
      '2A',
      'Response Error',
      {
        err,
        response,
        body
      }
    );

    if (typeof body === 'undefined') {
      return cb(invalidBodyError);
    }

    cb(null, response, body);
  };
}

function validateOptions(userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide your MISP API key'
    });
  }

  if (
    typeof userOptions.uri.value !== 'string' ||
    (typeof userOptions.uri.value === 'string' && userOptions.uri.value.length === 0)
  ) {
    errors.push({
      key: 'uri',
      message: 'You must provide a valid url for MISP'
    });
  }

  cb(null, errors);
}

// function that takes the ErrorObject and passes the error message to the notification window
function _createJsonErrorPayload(msg, pointer, httpCode, code, title, meta) {
  return {
    errors: [_createJsonErrorObject(msg, pointer, httpCode, code, title, meta)]
  };
}

function _sanitizeResponse(response) {
  if (response && response.request && response.request.headers && response.request.headers.Authorization) {
    response.request.headers.Authorization = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  }
}

// function that creates the Json object to be passed to the payload
function _createJsonErrorObject(msg, pointer, httpCode, code, title, meta) {
  if (meta.response) {
    _sanitizeResponse(meta.response);
  }

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
}

module.exports = {
  doLookup: doLookup,
  startup: startup,
  validateOptions: validateOptions,
  onDetails: onDetails,
  onMessage: onMessage
};
