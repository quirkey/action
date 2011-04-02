function(doc) {
  if (doc.type == 'action' && !doc.sleeping) {
    emit([doc.completed_at, doc.updated_at], doc._id);
  }
}
