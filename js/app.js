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

    var clearForm = function($scope) {
      $scope.find('.content-input').val('');
      $scope.find('.action-preview').html('');
    };

    var keymap = {
      n: function() {
       $('#main > .action-form .content-input').focus();
      }
    };

    this.helpers({
      hexToRGB: function(hex) {
        hex = hex.replace(/^\#/,'');
        var rgb = [], i = 0;
        for (;i < 6;i+=2) {
          rgb.push(parseInt(hex.substring(i,i+2),16));
        }
        return rgb;
      },
      textToColor: function(text, dark) {
        var rgb = this.hexToRGB(hex_sha1(text).substr(3,9));
        return "rgb(" + rgb.join(',') + ")";
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
              ctx.app.tokens = tokens; // assign tokens
              var token, color, sheet = [], count;
              for (token in tokens.token_groups['verb']) {
                count = tokens.token_groups['verb'][token];
                color = ctx.textToColor(token);
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
          .attr('class', 'search-token')
          .addClass([params.type, params.token].join('-'));
      },

      loadActions: function(action_func, header, options) {
        showLoading();
        this.buildTokenCSS();
        this.setSearchHeader(header || this.params);
        return this.load($('#templates .action-index'))
            .replace('#main')
            .send(Action[action_func], options)
            .renderEach($('#action-template'))
            .appendTo('#main .actions')
            .then('formatTimes')
            .then(hideLoading);
      },

      previewAction: function($input) {
        var $preview = $input.parents('form').siblings('.action-preview'),
            content = $input.val();
        $preview.html(Action.parsedToHTML(Action.parse(content)));
        this.drawTokenCounts($preview);
      },

      drawTokenCounts: function($scope) {
        var ctx = this;
        if (!ctx.app.tokens) return;
        $.each(['verb', 'subject'], function(i, token_type) {
          $scope.find('.' + token_type).each(function() {
            var $token = $(this),
                token = $token.text(),
                $sup = $token.children('sup'),
                count = ctx.app.tokens.token_groups[token_type][token];
            if (count) {
              if ($sup.length == 0) {
                $sup = $('<sup>').appendTo($token);
              }
              $sup.text(count);
            }
          });
        });
      },

      handleEdit: function(id) {
        if (!id) return;

        var $action = $('.action[data-id="' + id + '"]'),
            $action_form = $('.action-index .action-form').clone(false);
        Sammy.log('handleEdit', id, $action)
        // edit the form to our will
        $action_form
          .appendTo($action)
          .find('form')
            .attr('action', '#/action/' + id)
            .attr('method', 'put')
          .end()
          .find('.content-input')
            .val($.trim($action.find('.content').text().replace(/\s+/, ' ')))
            .trigger('keyup')
            .focus()
          .end()
        $action.find('.content, .controls, .meta').hide();
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
      $('.content-input').live('keyup', function(e) {
        ctx.previewAction($(this));
      });
      $('.action a.edit-action').live('click', function(e) {
        e.preventDefault();
        ctx.handleEdit($(this).attr('data-id'));
      });
    });

    this.get('#/', function(ctx) {
      this.loadActions('viewIndex', {});
    });

    this.post('#/action', function(ctx) {
      this.send(Action.create, this.params['action'])
          .then(function(response) {
            this.event_context.trigger('add-action', {id: response['id']});
          })
          .send(clearForm, $(this.target).parents('.action-form'));
    });

    this.put('#/action/:id', function(ctx) {
      this.send(Action.update, this.params.id, this.params['action'])
          .trigger('reload-action', {id: this.params.id});
    });

    this.get('#/archive', function(ctx) {
      this.loadActions('viewCompleted', {type: 'archive'});
    });

    this.get('#/action/search/:query', function(ctx) {
      var q = this.params.query.toString();
      this.loadActions('viewSearch', {type: 'search', token: q}, q);
    });

    this.get('#/action/:type/:token', function(ctx) {
      this.loadActions('viewByToken', this.params, this.params.toHash());
    });

    this.get('#/replicate', function(ctx) {
      showLoading();
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
        window.setTimeout(function() {
          $('[data-id="' + data.id + '"]')
            .fadeOut('slow', function() { $(this).remove() });
        }, 1000 * 3);
      } else {
        update = {completed: false, completed_at: null};
      }
      this.send(Action.update, data.id, update)
          .then(function() {
            data.$action.toggleClass('complete');
          });
    });

    this.bind('reload-action', function(e, data) {
      if (data.id) {
        var $action = $('.action[data-id="' + data.id + '"]');
        this.log('reload-action', data, $action);
        this.send(Action.get, data['id'])
            .render($('#action-template'))
            .then(function(content) {
              $action.replaceWith(content);
            })
            .then('formatTimes');
      }
    });


  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
