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

    var Action = this.createModel('action');
    Action.extend({
      parse: function(doc) {

      },
      beforeSave: function(doc) {

      }
    });

    this.bind('run', function() {
      showLoading();
    });

    this.get('#/', function(ctx) {
      this.load($('#action-index'))
          .replace('#main')
          .send(Action.viewDocs, 'by_type', {
            startkey: ["action",null],
            endkey: ["action", "a"]
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
