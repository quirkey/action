function(doc) {
  if (doc.type == 'action' && doc.sleeping) {
    emit([doc.slept_at, doc.slept_count, doc.updated_at], doc._id);
  }
}
