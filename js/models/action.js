Action = Sammy('#container').createModel('action');
Action.extend({
  tokens: {
    modifiers: ['for','of','about','to','with','in','around','up','down','and','a','an','the','out','into','-']
  },

  loadTokens: function(callback) {
    Action.view('tokens', {group: true}, function(tokens) {
      var token_groups = {verb:{}, subject:{}},
          max = {verb: 0, subject: 0},
          sheet = [],
          token, group, key, value;
      for (var i = 0;i < tokens.rows.length;i++) {
        token = tokens.rows[i];
        group = token['key'][0];
        key   = token['key'][1];
        value = token['value'];
        if (token_groups[group]) {
          token_groups[group][key] = value;
        }
        if (value > max[group]) { max[group] = value; }
      }
      callback({max: max, token_groups: token_groups});
    });
  },

  parse: function(content) {
    var arr = [], hash = {};
    content = $.trim(content.toString()); // ensure string
    tokens = content.split(/\s+/g);

    var token,
        subject,
        token_ctx,
        pushToken = function(type, t) {
          if (type) {
            hash[type] ? hash[type].push(t) : hash[type] = [t];
            arr.push([type, t]);
          } else {
            arr.push(t);
          }
        },
        isModifier = function(t) {
          return ($.inArray(t, Action.tokens.modifiers) != -1);
        };

    token_ctx = 'verb';
    var current = [];
    // iterate through the tokens
    for (var i=0; i < tokens.length; i++) {
      token = tokens[i];
      next_token = tokens[i + 1];
      if ($.trim(token) == '') break;
      switch (token_ctx) {
        case 'verb':
          pushToken('verb', token);
          token_ctx = 'subject';
          break;
        case 'subject':
          if (isModifier(token)) {
            if (current.length > 0) {
              pushToken('subject', current.join(' '));
            }
            pushToken(false, token);
            current = [];
          } else {
            current.push(token);
          }
          break;
        default:
          pushToken(false, token)
      }
    }
    if (current.length > 0) {
      pushToken('subject', current.join(' '));
    }
    Sammy.log('parsed', content, arr);
    return {array: arr, hash: hash};
  },

  parsedToHTML: function(parsed) {
    if (parsed['array']) {
      var html = [];
      for (var i=0; i<parsed['array'].length; i++) {
        var token = parsed['array'][i];
        if ($.isArray(token)) {
          html.push("<a href='#/' class='token ");
          html.push(token[0] + " ");
          html.push([token[0], token[1].replace(/\s/g, '-')].join('-') + "'>");
          html.push(token[1]);
          html.push('</a> ');
        } else {
          html.push(token + ' ');
        }
      }
      return html.join('');
    } else {
      return "";
    }
  },

  beforeSave: function(doc) {
    doc.parsed = this.parse(doc.content);
    doc.parsed_html = this.parsedToHTML(doc.parsed);
    Sammy.log('doc.parsed', doc.parsed);
    return doc;
  },

  viewIndex: function(options, callback) {
    return Action.viewDocs('by_complete', $.extend({
      startkey: [0,"a"],
      endkey: [null, null],
      descending: true
    }, options || {}), callback);
  },

  viewCompleted: function(options, callback) {
    return Action.viewDocs('by_complete', $.extend({
      startkey: ["a","a"],
      endkey: [1, null],
      descending: true
    }, options || {}), callback);
  },

  viewByToken: function(options, callback) {
    return Action.viewDocs('by_token', $.extend({
      startkey: [options.type, options.token + "a", "a"],
      endkey: [options.type, options.token, null],
      descending: true
    }, options || {}), callback);
  }

});
