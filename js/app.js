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

    this.get('#/', function(context) {
      this.load($('#action-index'))
          .replace('#main')
          .then(hideLoading);

      this.db().allDocs(function(docs) {
        this.log("docs", docs);
      });
    });

    this.post('#/action', function(context) {
      Action.create(this.params['action']);
    });

  }).run('#/');


})(jQuery);
