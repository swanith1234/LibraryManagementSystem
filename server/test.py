# Run this in Django shell: python manage.py shell

from books.models import Book

# Option 1: Drop all text indexes
try:
    collection = Book._get_collection()
    indexes = collection.list_indexes()
    
    for index in indexes:
        if 'textIndexVersion' in index:
            print(f"Dropping text index: {index['name']}")
            collection.drop_index(index['name'])
except Exception as e:
    print(f"Error dropping indexes: {e}")

# Option 2: Or drop all indexes except _id
try:
    Book._get_collection().drop_indexes()
    print("All indexes dropped successfully")
except Exception as e:
    print(f"Error: {e}")

# Recreate indexes based on model definition
try:
    Book.ensure_indexes()
    print("Indexes recreated successfully")
except Exception as e:
    print(f"Error recreating indexes: {e}")

# Verify the indexes
print("\nCurrent indexes:")
for index in Book._get_collection().list_indexes():
    print(index)