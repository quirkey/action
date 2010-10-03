(function($) {

  var app = $.sammy('#container', function() {
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

      ],
      hexToRGB: function(hex) {
        hex = hex.replace(/^\#/,'');
        var rgb = [], i = 0;
        for (;i < 6;i+=2) {
          rgb.push(parseInt(hex.substring(i,i+2),16));
        }
        return rgb;
      },

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
        this.send(Action.loadTokens)
            .then(function(tokens) {
              var verb_inc, token, color, sheet = [], count;
              verb_inc = tokens.max['verb'] / ctx.colors.length;
              for (token in tokens.token_groups['verb']) {
                count = tokens.token_groups['verb'][token];
                color = ctx.colors[Math.round(count / verb_inc) - 1];
                Sammy.log('verb_inc', verb_inc, 'count', count, 'color', color);
                sheet.push(['.verb-', token, ' { color:', color, ' !important;}'].join(''));
              }
              var $sheet = $('style#verb-sheet');
              if ($sheet.length == 0) {
                $sheet = $('<style type="text/css" id="verb-sheet" />').appendTo('body');
              }
              $sheet.text(sheet.join(' '));
            });
      },

      setSearchHeader: function(params) {
        this.log('setSearchHeader', params);
        if (params.length == 0) return;
        $('#header .search-type').text(params.type || '');
        $('#header .search-token')
          .text(params.token || '')
          .addClass([params.type, params.token].join('-'));
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
      $('.action .verb').live('click', function(e) {
        e.preventDefault();
        ctx.redirect('#', 'action', 'verb', $(this).text());
      });
      $('.action .subject').live('click', function(e) {
        e.preventDefault();
        ctx.redirect('#', 'action', 'subject', $(this).text());
      });
    });

    this.get('#/', function(ctx) {
      showLoading();
      this.buildTokenCSS();
      this.setSearchHeader({});
      this.load($('#templates .action-index'))
          .replace('#main')
          .send(Action.viewDocs, 'by_type', {
            startkey: ["action", "a"],
            endkey: ["action", null],
            descending: true
          })
          .renderEach($('#action-template'))
          .appendTo('#main .actions')
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

    this.get('#/archive', function(ctx) {
      showLoading();
      this.buildTokenCSS();
      this.setSearchHeader({type: 'archive'});
      this.load($('#templates .action-index'))
          .replace('#main')
          .send(Action.viewDocs, 'by_complete', {
        startkey: ["a","a"],
        endkey: [1, null],
        descending: true
      })
      .renderEach($('#action-template'))
      .appendTo('#main .actions')
      .then('formatTimes')
      .then(hideLoading);
    });

    this.get('#/action/:type/:token', function(ctx) {
      showLoading();
      this.buildTokenCSS();
      this.setSearchHeader(this.params);
      this.load($('#templates .action-index'))
          .replace('#main')
          .send(Action.viewDocs, 'by_token', {
            startkey: [this.params.type, this.params.token + "a"],
            endkey: [this.params.type, this.params.token],
            descending: true
          })
          .renderEach($('#action-template'))
          .appendTo('#main .actions')
          .then('formatTimes')
          .then(hideLoading);
    });

    this.get('#/replicate', function(ctx) {
      this.partial($('#replicator')).then(hideLoading);
    })

    this.bind('add-action', function(e, data) {
      this.log('add-action', 'params', this.params, 'data', data);
      this.buildTokenCSS();
      this.send(Action.get, data['id'])
          .render($('#action-template'))
          .prependTo('#main .actions')
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
