(function($) {

  var app = $.sammy('#main', function() {
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

    this.helpers({
      colors: [
        '#4685C0',
        '#3DB584',
        '#89B52F',
        '#B57E35',
        '#B54E37',
        '#98112C'
      ],
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
      },

      buildTokenCSS: function() {
        var ctx = this;
        this.send(Action.view, 'tokens', {
              group: true
            })
            .then(function(tokens) {
              ctx.log(tokens);
              var token_groups = {verb:{}, subject:{}},
                  max = {verb: 0, subject: 0},
                  token, group, key, value;
              for (var i = 0;i < tokens.rows.length;i++) {
                token = tokens.rows[i];
                group = token['key'][0];
                key   = token['key'][1];
                value = token['value'];
                if (token_groups[group]) {
                  token_groups[group][key] = value;
                }
                if (value > max[group]) { max[group] = value; }
              }
              max['verb']
            });
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
      this.buildTokenCSS();
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

  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
