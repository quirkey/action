(function($) {
  
  $.sammy('#container', function() {
    this.use('JSON')
        .use('Meld')
        .use('Storage');
    
    var showLoading = function() {
      $('#loading').show();
    };
    
    var hideLoading = function() {
      $('#loading').hide();
    };
    
    this.bind('run', function() {
      showLoading();
    });
    
    this.get('#/', function(context) {
      this.load('#action-index')
          .swap();
    });
    
  });
  
})(jQuery);