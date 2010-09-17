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
          .then(function(docs) {
            // this.next(this.event_context.meld($('#action-template'), docs[0]))
            this.next(docs);
          })
          .renderEach($('#action-template'), 'action')
          .then(function(content) {
            Sammy.log('finished content', content);
          })
          .appendTo('#actions')
          .then(hideLoading);
    });

    this.post('#/action', function(ctx) {
      Action.create(this.params['action'], function(response) {
        ctx.log(response);
      });
    });

  }).run('#/');


})(jQuery);
