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
          .then(function() {
            var rctx = this;
            rctx.wait();
            Action.all(function(docs) {
              Sammy.log(docs, rctx.waiting);
              rctx.content = docs;
              rctx.next();
            });
            return false;
          })
          .then(function(content) {
            ctx.log('should wait', content);
          })
          .then(hideLoading);

    });

    this.post('#/action', function(ctx) {
      Action.create(this.params['action'], function(response) {
        ctx.log(response);
      });
    });

  }).run('#/');


})(jQuery);
