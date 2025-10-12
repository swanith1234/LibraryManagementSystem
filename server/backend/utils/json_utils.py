def to_dict(document):
    """Convert a MongoEngine document to dict for JSON response"""
    data = document.to_mongo().to_dict()
    data["id"] = str(data.pop("_id"))  # convert MongoDB ObjectId to string
    return data

def to_dict_list(documents):
    return [to_dict(doc) for doc in documents]
