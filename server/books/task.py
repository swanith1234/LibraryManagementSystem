# books/tasks.py
import csv, io, time
from celery import shared_task
from mongoengine import DoesNotExist
from books.models import Book, BookCopy
from backend.utils.redis_client import redis_client


@shared_task(bind=True)
def process_bulk_upload(self, csv_data_str, task_id):
    """
    Background task to insert book copies and update book counters automatically.
    Expects CSV to contain details of each copy; total_copies and available_copies
    are managed automatically by BookCopy.save().
    """
    start_time = time.time()
    reader = csv.DictReader(io.StringIO(csv_data_str))
    total = sum(1 for _ in csv.DictReader(io.StringIO(csv_data_str)))
    processed = 0
    failed = 0

    # Re-read since we exhausted iterator
    reader = csv.DictReader(io.StringIO(csv_data_str))
    print(reader)
    for row in reader:
        try:
            # Try to find the book by title & author
            book = Book.objects(title=row.get("title"), author=row.get("author")).first()

            # If book does not exist, create it
            if not book:
                book = Book(
                    title=row.get("title"),
                    author=row.get("author"),
                    category=row.get("category"),
                    edition=row.get("edition", "1st"),
                    publisher=row.get("publisher"),
                    published_year=int(row.get("published_year", 0)) or None,
                    price=int(row.get("price", 0)),
                    location=row.get("location"),
                    isbn=row.get("isbn"),
                    language=row.get("language", "English"),
                    no_of_pages=int(row.get("no_of_pages", 0)) or None,
                    cover_image_url=row.get("cover_image_url"),
                    ebook_url=row.get("ebook_url"),
                )
                book.save()

            # Create a new copy if barcode is unique
            if row.get("barcode"):
                BookCopy(
                    book=book,
                    barcode=row.get("barcode"),
                    is_available=True,
                    is_damaged=False,
                    condition="Good"
                ).save()
                # BookCopy.save() will automatically increment total_copies and available_copies

            processed += 1

        except Exception as e:
            failed += 1

        # Update progress every 50 records
        if processed % 50 == 0 or processed == total:
            progress_data = {
                "processed": processed,
                "failed": failed,
                "total": total,
                "progress": round((processed / total) * 100, 2),
                "status": "running",
            }
            redis_client.hset(task_id, mapping=progress_data)

    # Mark complete
    progress_data.update({
        "status": "completed",
        "duration": round(time.time() - start_time, 2)
    })
    redis_client.hset(task_id, mapping=progress_data)
