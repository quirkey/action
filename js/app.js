(function($) {
  $.fn.d = function(n) {
    return $(this).attr('data-' + n);
  };

  var app = $.sammy('#container', function() {
    this.use('JSON')
        .use('Mustache')
        .use('Storage')
        .use('NestedParams')
        .use('Couch', 'action');

    var showLoading = function() {
      $('#loading').show();
    };

    var hideLoading = function() {
      $('#loading').hide();
    };

   // animate scroll the window to the current element
    var slideTo = function($el, offset, speed) {
      if (!speed) { speed = 400; }
      var top = $el.offset().top - (offset || 0);
      $('body,html').animate({'scrollTop': top + 'px'}, speed);
    };

    var clearForm = function($scope) {
      $scope.find('.content-input').val('');
      $scope.find('.action-preview').html('');
    };

    var keymap = {
      j: 'next-action',
      k: 'prev-action',
      esc: 'toggle-mode',
      x: 'toggle-action',
      z: 'sleep-action',
      i: 'edit-action',
      a: 'edit-action',
      n: 'new-action',
      g: 'first-action',
      'shift+g': 'last-action'
    };

    this.helpers({
      serializeObject: function(obj) {
        var o = {};
        var a = $(obj).serializeArray();
        $.each(a, function() {
          if (o[this.name]) {
            if (!o[this.name].push) {
              o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
          } else {
            o[this.name] = this.value || '';
          }
        });
        return o;
      },

      postReplication: function() {
        var helpers = this;
        $('.replicator-form').submit(function(e) {
          e.preventDefault();
          $.ajax({
            url: "/_replicate",
            type: "post",
            processData: false,
            data: JSON.stringify(helpers.serializeObject(e.target)),
            contentType: "application/json",
            success: function() { helpers.redirect('#/'); console.log('wee') }
          });
        })
      },

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

      focusOnAction: function($action) {
        if (!$action || $action.length === 0) {
          $action = this.app.$focused || $('.action:first');
        }
        if (this.app.$focused) {
          this.app.$focused.removeClass('focused');
        }
        $action.addClass('focused');
        slideTo($action, $action.outerHeight(), 200);
        this.app.$focused = $action;
        return this.app.$focused;
      },

      focusedAction: function() {
        if (this.app.$focused && this.app.$focused.is(':visible')) {
          return this.app.$focused;
        } else {
          return this.focusOnAction();
        }
      },

      bindHotkeys: function() {
        this.app.keymode = 'input';
        var ctx = this;
        $.each(keymap, function(key, eventname) {
          $(document)
            .bind('keyup', key, function() {
              Sammy.log('hotkey', key, eventname);
              ctx.trigger(eventname, {$action: ctx.focusedAction()});
            });
        });
      }

    });

    this.bind('run', function() {
      showLoading();
      this.bindHotkeys();
      var ctx = this;
      $('.action input.completed').live('click', function() {
        var $input = $(this), $action = $input.parents('.action');
        // race condition with the checkbox
        setTimeout(function() {
          ctx.trigger('toggle-action', {
            $action: $action, complete:
            $input.attr('checked')});
        }, 10);
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
        var $link = $(this), $action = $link.parents('.action');
        ctx.trigger('edit-action', {
          $action: $action
        });
      });
      $('.action a.sleep-action').live('click', function(e) {
        e.preventDefault();
        var $link = $(this), $action = $link.parents('.action');
        ctx.trigger('sleep-action', {
          $action: $action
        });
      });
      $('.action').live('click', function() {
        ctx.focusOnAction($(this));
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

    this.get('#/review', function(ctx) {
      this.loadActions('viewReview', {type: 'review'});
    });

    this.get('#/asleep', function(ctx) {
      this.loadActions('viewAsleep', {type: 'asleep'});
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
      this.partial($('#replicator'))
      .then(hideLoading)
      .then('postReplication');
    });

    this.bind('add-action', function(e, data) {
      this.log('add-action', 'params', this.params, 'data', data);
      this.buildTokenCSS();
      this.send(Action.get, data['id'])
          .render($('#action-template'))
          .prependTo('#main .actions')
          .then('formatTimes');
    });

    this.bind('toggle-action', function(e, data) {
      var $action = data.$action,
      id = $action.d('id');
      var complete = data.complete;
      this.log('toggle-action', $action, 'complete', complete);
      if (typeof complete == 'undefined') {
        $action.find('input:checkbox').click();
        return;
      }
      var update = {};
      if (complete) {
        update = {completed: true, completed_at: Action.timestamp()};
        window.setTimeout(function() {
          $action.fadeOut('slow', function() { $(this).remove(); });
        }, 1000 * 3);
      } else {
        update = {completed: false, completed_at: null};
      }
      this.send(Action.update, id, update)
          .then(function() {
            $action.toggleClass('complete');
          }).trigger('next-action', {$action: $action});
    });

    this.bind('sleep-action', function(e, data) {
      this.log('sleep-action', 'params', this.params, 'data', data);
      var update = {
         sleeping: true,
         slept_at: Action.timestamp(),
         slept_count: (data.$action.d('slept-count').slept_count || 0) + 1};

        window.setTimeout(function() {
          data.$action.fadeOut('slow', function() { $(this).remove(); });
        }, 1000);
        this.send(Action.update, data.$action.d('id'), update)
          .then(function() {
            data.$action.addClass('sleeping slept-' + update.slept_count);
          }).trigger('next-action', {$action: data.$action});
    });

    this.bind('edit-action', function(e, data) {
      var ctx = this,
          $action = data.$action,
          id = $action.d('id');
          $action_form = $('.action-index .action-form').clone(false);
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
          .bind('keyup', 'esc', function() {
            ctx.trigger('reload-action', {id: id});
           })
          .focus()
        .end();
      $action.find('.content, .controls, .meta').hide();
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
            .then('formatTimes')
            .then(function() {
              var $action = $('.action[data-id="' + data.id + '"]');
              this.event_context.focusOnAction($action);
            });
      }
    });

    this.bind('next-action', function(e, data) {
      var $action = data.$action;
      this.focusOnAction($action.next('.action'));
    });

    this.bind('prev-action', function(e, data) {
      var $action = data.$action;
      this.focusOnAction($action.prev('.action'));
    });

    this.bind('new-action', function(e, data) {
      var ctx = this;
      $('.action-form:first input.content-input').focus()
        .one('keyup', 'esc', function() {
          $(this).blur();
          ctx.focusOnAction();
        });
    });

    this.bind('first-action', function() {
      this.focusOnAction($('.action:first'));
    });

    this.bind('last-action', function() {
      this.focusOnAction($('.action:last'));
    });
  });

  $(function() {
    app.run('#/');
  });

})(jQuery);
