Action = Sammy('#main').createModel('action');
Action.extend({
  tokens: {
    modifiers: ['for','of','about','to','with','in','around','up','down','and','a','an','the']
  },

  parse: function(content) {
    var arr = [], hash = {};
    content = $.trim(content.toString()); // ensure string
    tokens = content.split(/\s/g);

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
      switch (token_ctx) {
        case 'verb':
          pushToken('verb', token);
          token_ctx = 'subject';
          break;
        case 'subject':
          if (isModifier(token)) {
            pushToken('subject', current.join(' '));
            pushToken('modifier', token);
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
    return {array: arr, hash: hash};
  },

  parsedToHTML: function(parsed) {
    if (parsed['array']) {
      var html = [];
      for (var i=0; i<parsed['array'].length; i++) {
        var token = parsed['array'][i];
        if ($.isArray(token)) {
          html.push("<span class='token ");
          html.push(token[0] + " ");
          html.push([token[0], token[1].replace(/\s/g, '-')].join('-') + "'>");
          html.push(token[1]);
          html.push('</span> ');
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
  }
});
