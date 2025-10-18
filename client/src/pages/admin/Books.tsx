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
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  UploadCloud,
  CheckCircle,
  Loader,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const progressInterval = useRef<NodeJS.Timer | null>(null);

  // Pagination & Filtering states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [lastId, setLastId] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [paginationHistory, setPaginationHistory] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [publishedYear, setPublishedYear] = useState("");

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

  // Fetch books with cursor-based pagination
  const fetchBooks = async (useLastId: boolean = false) => {
    setLoading(true);
    try {
      const params: any = {
        page_size: pageSize,
      };

      if (searchQuery) params.search = searchQuery;
      if (category) params.category = category;
      if (author) params.author = author;
      if (priceMin) params.price_min = priceMin;
      if (priceMax) params.price_max = priceMax;
      if (publishedYear) params.published_year = publishedYear;

      if (useLastId && lastId) {
        params.last_id = lastId;
      }

      const response = await booksAPI.list(params);
      const data = response.data || [];

      setBooks(data);
      setFilteredBooks(data);

      // Determine if there's a next page (more items than page_size means next page exists)
      setHasNextPage(data.length === pageSize);

      // Store the last book's ID for cursor-based pagination
      if (data.length > 0) {
        setLastId(data[data.length - 1].id);
      }
    } catch (err) {
      toast.error("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [
    searchQuery,
    category,
    author,
    priceMin,
    priceMax,
    publishedYear,
    pageSize,
  ]);

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
      setPage(1);
      setPaginationHistory([]);
      setLastId(null);
      fetchBooks();
    } catch (err) {
      toast.error(
        editingBook ? "Failed to update book" : "Failed to create book"
      );
    }
  };

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
      setPage(1);
      setPaginationHistory([]);
      setLastId(null);
      fetchBooks();
    } catch (err) {
      toast.error("Failed to delete book");
    }
  };

  // Start progress tracking
  const startProgressTracking = (taskId: string) => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    progressInterval.current = setInterval(async () => {
      try {
        const progressRes = await booksAPI.uploadProgress(taskId);
        setUploadProgress(progressRes.data);

        if (progressRes.data.status === "completed") {
          if (progressInterval.current) clearInterval(progressInterval.current);
          toast.success("CSV upload completed!");
          setPage(1);
          setPaginationHistory([]);
          setLastId(null);
          fetchBooks();
          setCsvFile(null);
          setUploadTaskId(null);
          sessionStorage.removeItem("uploadTaskId");
          setTimeout(() => {
            setUploadProgress(null);
          }, 2000);
        }
      } catch (err) {
        toast.error("Failed to fetch upload progress");
      }
    }, 2000);
  };

  // CSV Upload
  const handleCsvUpload = async () => {
    if (!csvFile) return toast.error("Select a CSV file");
    if (!csvFile.name.endsWith(".csv")) return toast.error("Only CSV allowed");

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const response = await booksAPI.bulkUpload(formData);
      const taskId = response.data.task_id;
      setUploadTaskId(taskId);
      setUploadProgress({ status: "started", progress: 0 });
      sessionStorage.setItem("uploadTaskId", taskId);
      setIsUploading(false);
      startProgressTracking(taskId);
    } catch (err) {
      setIsUploading(false);
      toast.error("Failed to upload CSV");
    }
  };

  const getStatusIcon = () => {
    if (!uploadProgress) return null;
    if (
      uploadProgress.status === "processing" ||
      uploadProgress.status === "started"
    ) {
      return <Loader className="h-5 w-5 animate-spin text-blue-600" />;
    }
    if (uploadProgress.status === "completed") {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (!uploadProgress) return "Upload CSV";
    if (
      uploadProgress.status === "processing" ||
      uploadProgress.status === "started"
    ) {
      return `Uploading... ${Number(uploadProgress.progress).toFixed(0)}%`;
    }
    if (uploadProgress.status === "completed") {
      return "Upload Complete!";
    }
    return "Upload CSV";
  };

  const handleNextPage = () => {
    if (hasNextPage && lastId) {
      setPaginationHistory([...paginationHistory, lastId]);
      setPage(page + 1);
      fetchBooks(true);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const newHistory = paginationHistory.slice(0, -1);
      setPaginationHistory(newHistory);
      setPage(page - 1);
      setLastId(
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : null
      );
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

        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
              setPaginationHistory([]);
              setLastId(null);
            }}
            className="max-w-sm"
          />
          <Button onClick={() => fetchBooks()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            disabled={!!uploadTaskId}
          />

          {/* Dynamic Upload Button Section */}
          {!uploadProgress && !isUploading ? (
            <Button
              onClick={handleCsvUpload}
              disabled={!csvFile || !!uploadTaskId}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
          ) : isUploading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <Loader className="h-5 w-5 animate-spin text-blue-600" />
              <span className="font-semibold text-blue-900">
                Initializing upload...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              {getStatusIcon()}
              <span className="font-semibold text-blue-900">
                {getStatusText()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowProgressModal(true)}
                className="ml-2"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-lg border">
        <Input
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
            setPaginationHistory([]);
            setLastId(null);
          }}
        />
        <Input
          placeholder="Filter by author..."
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            setPage(1);
            setPaginationHistory([]);
            setLastId(null);
          }}
        />
        <Input
          placeholder="Price min..."
          type="number"
          value={priceMin}
          onChange={(e) => {
            setPriceMin(e.target.value);
            setPage(1);
            setPaginationHistory([]);
            setLastId(null);
          }}
        />
        <Input
          placeholder="Price max..."
          type="number"
          value={priceMax}
          onChange={(e) => {
            setPriceMax(e.target.value);
            setPage(1);
            setPaginationHistory([]);
            setLastId(null);
          }}
        />
        <Input
          placeholder="Published year..."
          type="number"
          value={publishedYear}
          onChange={(e) => {
            setPublishedYear(e.target.value);
            setPage(1);
            setPaginationHistory([]);
            setLastId(null);
          }}
        />
      </div>

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Bulk Upload Progress
            </DialogTitle>
          </DialogHeader>

          {uploadProgress && (
            <div className="space-y-6">
              {/* Enhanced Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">
                    Overall Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {Number(uploadProgress.progress).toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{
                      width: `${Math.min(uploadProgress.progress, 100)}%`,
                    }}
                  >
                    <div className="h-full bg-white opacity-20 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="text-xs font-semibold text-slate-600 mb-1">
                    Processed
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadProgress.processed || 0}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="text-xs font-semibold text-slate-600 mb-1">
                    Failed
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {uploadProgress.failed || 0}
                  </div>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 mb-1">
                    Total
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {uploadProgress.total || "?"}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {(uploadProgress.status === "processing" ||
                  uploadProgress.status === "started") && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-300 rounded-full">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-blue-900">
                      Processing...
                    </span>
                  </div>
                )}
                {uploadProgress.status === "completed" && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      Completed successfully!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProgressModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No books found</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {book.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                  {book.author}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {book.publisher} • {book.published_year || "-"}
                </p>
                {book.price && (
                  <p className="text-sm font-semibold text-blue-600">
                    ₹{book.price}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-4 border rounded-md bg-muted/50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm">
              Per page:
            </Label>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(parseInt(val));
                setPage(1);
                setPaginationHistory([]);
                setLastId(null);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

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
