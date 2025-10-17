import { useEffect, useState, useRef } from "react";
import { booksAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, RefreshCw, UploadCloud } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category?: string;
  publisher?: string;
  published_year?: number;
  total_copies?: number;
  available_copies?: number;
  cover_image_url?: string;
  price?: number;
  language?: string;
  edition?: string;
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const progressInterval = useRef<NodeJS.Timer | null>(null);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    publisher: "",
    published_year: "",
    total_copies: "",
    available_copies: "",
    cover_image_url: "",
    price: "",
    language: "english",
    edition: "",
  });

  // Fetch books from API
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await booksAPI.list();
      const data = response.data || [];
      setBooks(data);
      setFilteredBooks(data);
    } catch (err) {
      toast.error("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Filter books locally
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredBooks(books);
      return;
    }
    setFilteredBooks(
      books.filter((book) => {
        const title = book.title?.toLowerCase() || "";
        const author = book.author?.toLowerCase() || "";
        const isbn = book.isbn?.toLowerCase() || "";
        const category = book.category?.toLowerCase() || "";
        const publisher = book.publisher?.toLowerCase() || "";
        const language = book.language?.toLowerCase() || "";
        return (
          title.includes(q) ||
          author.includes(q) ||
          isbn.includes(q) ||
          category.includes(q) ||
          publisher.includes(q) ||
          language.includes(q)
        );
      })
    );
  }, [searchQuery, books]);

  const handleCardClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title || "",
        author: book.author || "",
        isbn: book.isbn || "",
        category: book.category || "",
        publisher: book.publisher || "",
        published_year: book.published_year?.toString() || "",
        total_copies: book.total_copies?.toString() || "",
        available_copies: book.available_copies?.toString() || "",
        cover_image_url: book.cover_image_url || "",
        price: book.price?.toString() || "",
        language: book.language || "english",
        edition: book.edition || "",
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: "",
        author: "",
        isbn: "",
        category: "",
        publisher: "",
        published_year: "",
        total_copies: "",
        available_copies: "",
        cover_image_url: "",
        price: "",
        language: "english",
        edition: "",
      });
    }
    setDialogOpen(true);
  };

  // Create or update book
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bookData: any = {
      ...formData,
      published_year: formData.published_year
        ? parseInt(formData.published_year)
        : undefined,
      total_copies: formData.total_copies
        ? parseInt(formData.total_copies)
        : undefined,
      available_copies: formData.available_copies
        ? parseInt(formData.available_copies)
        : undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
    };

    try {
      if (editingBook) {
        await booksAPI.update(editingBook.id, bookData);
        toast.success("Book updated successfully");
      } else {
        await booksAPI.create(bookData);
        toast.success("Book created successfully");
      }
      setDialogOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(
        editingBook ? "Failed to update book" : "Failed to create book"
      );
    }
  };

  // Delete
  const confirmDelete = (id: string) => {
    setDeleteBookId(id);
    setDeleteDialogOpen(true);
  };
  const handleDelete = async () => {
    if (!deleteBookId) return;
    try {
      await booksAPI.delete(deleteBookId);
      toast.success("Book deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteBookId(null);
      fetchBooks();
    } catch (err) {
      toast.error("Failed to delete book");
    }
  };

  // CSV Upload
  const handleCsvUpload = async () => {
    if (!csvFile) return toast.error("Select a CSV file");
    if (!csvFile.name.endsWith(".csv")) return toast.error("Only CSV allowed");

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const response = await booksAPI.bulkUpload(formData);
      const taskId = response.data.task_id;
      setUploadTaskId(taskId);
      setUploadProgress({ status: "started", progress: 0 });

      progressInterval.current = setInterval(async () => {
        const progressRes = await booksAPI.uploadProgress(taskId);
        setUploadProgress(progressRes.data);

        if (progressRes.data.status === "completed") {
          toast.success("CSV upload completed!");
          if (progressInterval.current) clearInterval(progressInterval.current);
          fetchBooks();
          setCsvFile(null);
          setUploadTaskId(null);
        }
      }, 2000);
    } catch (err) {
      toast.error("Failed to upload CSV");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Books Management</h1>
          <p className="text-muted-foreground">
            Manage your library's book collection
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Search by title, author, ISBN, category, or publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={fetchBooks} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          />
          <Button
            onClick={handleCsvUpload}
            disabled={!csvFile || !!uploadTaskId}
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>
      </div>

      {/* CSV Upload Progress */}
      {uploadProgress && (
        <div className="p-4 bg-gray-100 rounded-md">
          <p>Status: {uploadProgress.status}</p>
          <p>Processed: {uploadProgress.processed}</p>
          <p>Failed: {uploadProgress.failed}</p>
          <p>Progress: {uploadProgress.progress.toFixed(2)}%</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <p className="text-center text-muted-foreground">No books found</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card
              key={book.id}
              className="shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleCardClick(book.id)}
            >
              <CardHeader className="relative">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-40 object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-t-xl text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(book);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(book.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold">
                  {book.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mb-1">
                  {book.author}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {book.publisher} • {book.published_year || "-"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBook ? "Edit Book" : "Add Book"}</DialogTitle>
            <DialogDescription>
              {editingBook ? "Update book details" : "Create a new book record"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter book title"
                    required
                  />
                </div>
                <div>
                  <Label>Author *</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    placeholder="Enter author name"
                    required
                  />
                </div>
              </div>

              {/* Publisher & Published Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Publisher</Label>
                  <Input
                    value={formData.publisher}
                    onChange={(e) =>
                      setFormData({ ...formData, publisher: e.target.value })
                    }
                    placeholder="Enter publisher name"
                  />
                </div>
                <div>
                  <Label>Published Year</Label>
                  <Input
                    type="number"
                    value={formData.published_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        published_year: e.target.value,
                      })
                    }
                    placeholder="e.g. 2024"
                  />
                </div>
              </div>

              {/* Category & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Fiction, Science, History, etc."
                  />
                </div>
                <div>
                  <Label>Language</Label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="hindi">Hindi</option>
                    <option value="telugu">Telugu</option>
                    <option value="tamil">Tamil</option>
                    <option value="kannada">Kannada</option>
                    <option value="malayalam">Malayalam</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Edition & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Edition</Label>
                  <Input
                    value={formData.edition}
                    onChange={(e) =>
                      setFormData({ ...formData, edition: e.target.value })
                    }
                    placeholder="1st, 2nd, 3rd..."
                  />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Enter price"
                  />
                </div>
              </div>

              {/* Total Copies & Available Copies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Total Copies</Label>
                  <Input
                    type="number"
                    value={formData.total_copies}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_copies: e.target.value,
                      })
                    }
                    placeholder="Total number of copies"
                  />
                </div>
                <div>
                  <Label>Available Copies</Label>
                  <Input
                    type="number"
                    value={formData.available_copies}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        available_copies: e.target.value,
                      })
                    }
                    placeholder="Available copies"
                  />
                </div>
              </div>

              {/* ISBN */}
              <div>
                <Label>ISBN</Label>
                <Input
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                  placeholder="ISBN-10 or ISBN-13"
                />
              </div>

              {/* Cover Image URL */}
              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={formData.cover_image_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cover_image_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description / Notes</Label>
                <Textarea
                  value={(formData as any).description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    } as any)
                  }
                  placeholder="Brief description or notes about the book"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBook ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete book?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove the book from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
