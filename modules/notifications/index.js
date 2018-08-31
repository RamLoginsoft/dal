var
r = require('ramda'),
sendgrid = require('@sendgrid/mail'),
util = require('util');

var alerts = module.exports = function ( appConfig ) {
  sendgrid.setApiKey(appConfig.mailer.apiKey);
  var
  user = appConfig.mailer.user,
  pass = appConfig.mailer.pass,
  sendEmail= sendAlertEmail.bind(
    null,
    sendgrid,
    appConfig
  );

  alerts.listen = function ( database ) {    
    var ok = r.compose(
      r.curry(attachEventListeners)(database, sendEmail),
      toNamespacedEventList
    )(appConfig.events);
  };
  
  // module api
  return alerts;
  
  
  /* module fns */

  function sendAlertEmail ( emailer, config, event, eventArg ) {
    var
    subject = config
      .subject
      .replace('$hostname', config.client ?
               config.client.hostname :
               'n/a'),
    client = config.client || {},    
    content = [
      'DATA ACCESS EVENT NOTIFICATION',
      'Application: ' + client.name || 'n/a',
      'Server: ' + client.hostname || 'n/a',
      'Event: ' + event,
      'Error/Arguments: ' + (eventArg || 'n/a')]
      .join('\n\n');
    
    /*emailer.send({
      to: config.to,
      from: config.from,
      subject: subject,
      text: content
    });*/
      emailer.send({
          to: config.to,
          from: config.from,
          subject: subject,
          text: content
      }, function(err, result) {
          if(err) return done(err);
          else return done(null, result);
      });
  }

  function attachEventListeners ( database, sendEmail, events ) {
    r.forEach(function ( event ) {
      database.on(event, function ( eventArg ) {
        sendEmail(event, eventArg);
      });
    }, events);
    return events;
  }

  function toNamespacedEventList ( eventConfig ) {
    return r.reduce(function ( memo, ns ) {
      return r.compose(
        r.concat(memo),
        r.map(function ( event ) {
          return r.join('.', [ns, event]);
        })
      )(eventConfig[ns]);
    }, [],  r.keys(eventConfig));
  }

  function formatEventArg ( eventArg ) {
    return r.compose(
      r.assoc('name', eventArg.name || 'n/a'),
      r.assoc('message', eventArg.message || 'n/a')
    )(!eventArg ? {} : eventArg);
  }

};
