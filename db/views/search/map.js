function(doc) {
  if (doc.type && doc.type == 'action' && doc.content) {
    var words = doc.content.split(/\s+/), i = 0;
    for (;i<words.length;i++) {
     emit(words[i].toLowerCase().split(''), doc._id);
    }
  }
}
