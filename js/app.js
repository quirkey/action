(function($) {

  $.sammy('#container', function() {
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
        before_subject: ['for','about','to','with']
      },
      parse: function(content) {
        var parsed = {};
        content = $.trim(content.toString()); // ensure string
        tokens = content.split(/\s/g);
        parsed['verb'] = tokens.shift();
        // iterate through the tokens
        for (var i=0; i < tokens.length; i++) {
          if ($.inArray(tokens[i], this.tokens.before_subject) != -1) {
            parsed['subject'] = tokens[i + 1];
          }
        }
        return parsed;
      },
      beforeSave: function(doc) {
        doc.parsed = this.parse(doc.content);
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
            this.event_context.trigger('add-action', {id: response['id']})
          })
          .send(clearForm);
    });

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
