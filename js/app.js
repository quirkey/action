(function($) {

  $.sammy('#main', function() {
    this.use('JSON')
        .use('Mustache')
        .use('Storage')
        .use('NestedParams')
        .use('Couch');

    var showLoading = function() {
      $('#loading').show();
    };

    var hideLoading = function() {
      $('#loading').hide();
    };

    var clearForm = function() {
      $('.content-input').val('');
    };

    Action = this.createModel('action');
    Action.extend({
      tokens: {
        modifiers: ['for','of','about','to','with','in','around','up','down','and','a','an','the']
      },

      parse: function(content) {
        var arr = [], hash = {};
        content = $.trim(content.toString()); // ensure string
        tokens = content.split(/\s/g);

        var token,
            subject,
            token_ctx,
            pushToken = function(type, t) {
              if (type) {
                hash[type] ? hash[type].push(t) : hash[type] = [t];
                arr.push([type, t]);
              } else {
                arr.push(t);
              }
            },
            isModifier = function(t) {
              return ($.inArray(t, Action.tokens.modifiers) != -1);
            };

        token_ctx = 'verb';
        var current = [];
        // iterate through the tokens
        for (var i=0; i < tokens.length; i++) {
          token = tokens[i];
          next_token = tokens[i + 1];
          switch (token_ctx) {
            case 'verb':
              pushToken('verb', token);
              if (!isModifier(next_token)) {
                token_ctx = 'subject';
              }
              break;
            case 'subject':
              if (isModifier(token)) {
                pushToken('subject', current.join(' '));
                pushToken('modifier', token);
                current = [];
              } else {
                current.push(token);
              }
              break;
            default:
              pushToken(false, token)
          }
        }
        if (current.length > 0) {
          pushToken('subject', current.join(' '));
        }
        return {array: arr, hash: hash};
      },

      parsedToHTML: function(parsed) {
        if (parsed['array']) {
          var html = [];
          for (var i=0; i<parsed['array'].length; i++) {
            var token = parsed['array'][i];
            if ($.isArray(token)) {
              html.push("<span class='token ");
              html.push(token[0] + " ");
              html.push([token[0], token[1].replace(/\s/g, '-')].join('-') + "'>");
              html.push(token[1]);
              html.push('</span> ');
            } else {
              html.push(token + ' ');
            }
          }
          return html.join('');
        } else {
          return "";
        }
      },

      beforeSave: function(doc) {
        doc.parsed = this.parse(doc.content);
        doc.parsed_html = this.parsedToHTML(doc.parsed);
        Sammy.log('doc.parsed', doc.parsed);
        return doc;
      }
    });

    this.helpers({
      timestr: function(milli) {
        if (!milli || $.trim(milli) == '') { return ''; }
        var date = new Date(parseInt(milli, 10));
        return date.strftime('%c');
      },

      formatTimes: function() {
        var ctx = this;
        $('.timestr').text(function(i, original_text) {
          return ctx.timestr(original_text);
        }).removeClass('timestr').addClass('time');
      }
    });

    this.bind('run', function() {
      showLoading();
      var ctx = this;
      $('.action input.completed').live('click', function() {
        var $action = $(this).parents('.action');
        ctx.trigger('toggle-action', {
          id: $action.attr('data-id'),
          $action: $action,
          complete: $(this).attr('checked')
        });
      });
    });

    this.get('#/', function(ctx) {
      this.load($('#action-index'))
          .replace('#main')
          .send(Action.viewDocs, 'by_type', {
            startkey: ["action", "a"],
            endkey: ["action", null],
            descending: true
          })
          .renderEach($('#action-template'))
          .appendTo('#actions')
          .then('formatTimes')
          .then(hideLoading);
    });

    this.post('#/action', function(ctx) {
      this.send(Action.create, this.params['action'])
          .then(function(response) {
            this.event_context.trigger('add-action', {id: response['id']});
          })
          .send(clearForm);
    });

    this.get('#/replicate', function(ctx) {
      this.partial($('#replicator')).then(hideLoading);
    })

    this.bind('add-action', function(e, data) {
      this.log('add-action', 'params', this.params, 'data', data);
      this.send(Action.get, data['id'])
          .render($('#action-template'))
          .prependTo('#actions')
          .then('formatTimes');
    });

    this.bind('toggle-action', function(e, data) {
      this.log('toggle-action', 'params', this.params, 'data', data);
      var update = {};
      if (data.complete) {
        update = {completed: true, completed_at: Action.timestamp()};
      } else {
        update = {completed: false, completed_at: null};
      }
      this.send(Action.update, data.id, update)
          .then(function() {
            data.$action.toggleClass('complete');
          });
    });

  }).run('#/');


})(jQuery);
