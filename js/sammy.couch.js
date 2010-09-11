(function($, Sammy) {

  Sammy = Sammy || {};

  Sammy.Couch = function(app, dbname) {

    // set the default dbname form the URL
    dbname = dbname || window.location.pathname.split('/')[1];

    var db = function() {
      if (!dbname) {
        throw("Please define a db to load from");
      }
      return this._db = this._db || $.couch.db(dbname);
    };

    var timestamp = function() {
      return Math.round(new Date().getTime() / 1000);
    };

    this.db = db();

    this.createModel = function(type, options) {
      options = $.extend({
        defaultDocument: function() {
          return {
            type: type,
            updated_at: timestamp()
          }
        },
        errorHandler: function(response) {
          app.trigger('error.' + type, {error: error});
        }
      }, options || {});

      var mergeCallbacks = function(callback) {
        var base = {error: options.errorHandler};
        if ($.isFunction(callback)) {
          return $.extend(base, {success: callback});
        } else {
          return $.extend(base, callback || {})
        }
      };

      var mergeDefaultDocument = function(doc) {
        return $.extend({}, options.defaultDocument(), doc);
      };

      return {
        timestamp: timestamp,
        extend: function(obj) {
          $.extend(this, obj);
        },
        all: function(callback) {
          return app.db.allDocs($.extend(mergeCallbacks(callback), {
            include_docs: true
          }));
        },
        create: function(doc, callback) {
          return app.db.saveDoc(mergeDefaultDocument(doc), mergeCallbacks(callback));
        }
      }
    };

    this.helpers({
      db: db()
    })
  };

})(jQuery, window.Sammy);
