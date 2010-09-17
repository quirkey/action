(function($) {

  $.sammy('#container', function() {
    this.use('JSON')
        .use('Meld')
        .use('Storage')
        .use('NestedParams')
        .use('Couch');

    var showLoading = function() {
      $('#loading').show();
    };

    var hideLoading = function() {
      $('#loading').hide();
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

    this.bind('run', function() {
      showLoading();
    });

    this.get('#/', function(ctx) {
      this.load($('#action-index'))
          .replace('#main')
          .send(Action.viewDocs, 'by_type', {
            startkey: ["action", "a"],
            endkey: ["action", null],
            descending: true
          })
          .renderEach($('#action-template'), 'action')
          .appendTo('#actions')
          .then(hideLoading);
    });

    this.post('#/action', function(ctx) {
      Action.create(this.params['action'], function(response) {
        ctx.log(response);
        ctx.trigger('add-action', {id: response['id']});
      });
    });

    this.bind('add-action', function(e, data) {
      this.log('add-action', 'params', this.params, 'data', data);
      this.send(Action.get, data['id'])
          .then(function(content) {
            this.next({action: content});
          })
          .render($('#action-template'))
          .prependTo('#actions');
    });

  }).run('#/');


})(jQuery);
