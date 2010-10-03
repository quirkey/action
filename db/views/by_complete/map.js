function(doc) {
  if (doc.type == 'action') {
    emit([doc.completed_at, doc.updated_at], doc._id);
  }
}
