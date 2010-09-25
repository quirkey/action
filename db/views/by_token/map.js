function(doc) {
  if (doc.parsed && doc.parsed.hash) {
    for (var t in doc.parsed.hash) {
      for (var i = 0;i < doc.parsed.hash[t].length;i++) {
        emit([t, doc.parsed.hash[t][i]], doc._id);
      }
    }
  }
}
