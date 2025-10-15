import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { booksAPI, copiesAPI, borrowAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category?: string;
  description?: string;
  publication_year?: number;
  available_copies?: number;
  cover_image_url?: string;
}

interface BookCopy {
  _id: string;
  barcode: string;
  condition: string;
}

export default function MemberBrowse() {
  const navigate = useNavigate();
  const [categoryBooks, setCategoryBooks] = useState<Record<string, Book[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [availableCopies, setAvailableCopies] = useState<BookCopy[]>([]);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategoryBooks();
  }, []);

  const fetchCategoryBooks = async () => {
    setLoading(true);
    try {
      const response = await booksAPI.home(); // expected shape: { data: { categoryName: [books] } }
      // defensive: normalize keys to _id
      const booksWithCopies: Record<string, Book[]> = {};
      for (const [category, books] of Object.entries(response.data || {})) {
        booksWithCopies[category] = (books as Book[]).map((book) => ({
          ...book,
          _id: (book as any)._id || (book as any).id, // normalize
        }));
      }
      setCategoryBooks(booksWithCopies);
    } catch (error) {
      toast.error("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowClick = async (book: Book) => {
    setSelectedBook(book);
    try {
      const response = await copiesAPI.list({
        book_id: book._id,
        status: "available",
      });
      setAvailableCopies(response.data || []);
      setBorrowDialogOpen(true);
    } catch (error) {
      toast.error("Failed to fetch available copies");
    }
  };

  const handleBorrow = async () => {
    if (!selectedBook || !selectedBarcode) return;
    try {
      await borrowAPI.borrow({
        book_id: selectedBook._id,
        barcode: selectedBarcode,
      });
      toast.success("Book borrowed successfully");
      setBorrowDialogOpen(false);
      setSelectedBarcode("");
      fetchCategoryBooks();
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to borrow book";
      toast.error(message);
    }
  };

  // Filter results by search
  const filteredCategoryBooks = Object.fromEntries(
    Object.entries(categoryBooks).map(([category, books]) => [
      category,
      books.filter((book) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          book.title?.toLowerCase().includes(q) ||
          book.author?.toLowerCase().includes(q) ||
          book.isbn?.toLowerCase().includes(q) ||
          (book.category || "").toLowerCase().includes(q)
        );
      }),
    ])
  );

  const handleCardClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="site-container space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browse Books</h1>
        <p className="text-muted-foreground">
          Discover and borrow books from our collection
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title, author, ISBN, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <div className="flex gap-4 overflow-x-auto">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-48 w-32" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(filteredCategoryBooks).map(([category, books]) => (
          <div key={category} className="space-y-2">
            <h2 className="text-xl font-semibold">{category}</h2>
            {books.length === 0 ? (
              <p className="text-sm text-muted-foreground">No books found</p>
            ) : (
              <div className="horizontal-scroll-row scrollbar-hide flex-nowrap">
                {books.map((book) => (
                  <Card
                    key={book._id}
                    className="hover-scale flex-shrink-0 w-40 cursor-pointer scroll-snap-item"
                    onClick={() => handleCardClick(book._id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1">
                            {book.title}
                          </CardTitle>
                          <CardDescription>{book.author}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {book.cover_image_url && (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="h-32 w-full object-cover rounded max-w-full"
                        />
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{book.category || "Unknown"}</span>
                        <span>{book.publication_year || "-"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
