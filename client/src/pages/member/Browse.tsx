import { useEffect, useState } from "react";
import { booksAPI, copiesAPI, borrowAPI } from "@/lib/api";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  const [categoryBooks, setCategoryBooks] = useState<Record<string, Book[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [availableCopies, setAvailableCopies] = useState<BookCopy[]>([]);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [borrowing, setBorrowing] = useState(false);

  useEffect(() => {
    fetchCategoryBooks();
  }, []);

  const fetchCategoryBooks = async () => {
    setLoading(true);
    try {
      const response = await booksAPI.home();
      const booksWithCopies: Record<string, Book[]> = {};
      for (const [category, books] of Object.entries(response.data || {})) {
        booksWithCopies[category] = (books as Book[]).map((book) => ({
          ...book,
          _id: (book as any)._id || (book as any).id,
        }));
      }
      setCategoryBooks(booksWithCopies);
    } catch (error) {
      toast.error("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  // const handleBorrowClick = async (book: Book, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   setSelectedBook(book);
  //   try {
  //     const response = await copiesAPI.list({
  //       book_id: book._id,
  //       status: "available",
  //     });
  //     setAvailableCopies(response.data || []);
  //     setBorrowDialogOpen(true);
  //   } catch (error) {
  //     toast.error("Failed to fetch available copies");
  //   }
  // };

  // const handleBorrow = async () => {
  //   if (!selectedBook || !selectedBarcode) {
  //     toast.error("Please select a copy");
  //     return;
  //   }
  //   setBorrowing(true);
  //   try {
  //     await borrowAPI.borrow({
  //       book_id: selectedBook._id,
  //       barcode: selectedBarcode,
  //     });
  //     toast.success("Book borrowed successfully");
  //     setBorrowDialogOpen(false);
  //     setSelectedBarcode("");
  //     setSelectedBook(null);
  //     fetchCategoryBooks();
  //   } catch (error: any) {
  //     const message = error?.response?.data?.error || "Failed to borrow book";
  //     toast.error(message);
  //   } finally {
  //     setBorrowing(false);
  //   }
  // };

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
    window.location.href = `/books/${bookId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Browse Collection
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Explore our curated collection and discover your next great read
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div
            className="relative group animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-slate-800 rounded-lg border border-slate-700 group-hover:border-slate-600 transition duration-300 flex items-center px-4">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                placeholder="Search by title, author, ISBN, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 py-3 px-4"
              />
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="space-y-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-4 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-8 w-1/4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div
                        key={j}
                        className="bg-slate-700 rounded-xl h-80 animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(filteredCategoryBooks).map(
                ([category, books], idx) => (
                  <div
                    key={category}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between mb-6 cursor-pointer group"
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category ? null : category
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded group-hover:w-12 transition-all duration-300"></div>
                        <h2 className="text-2xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {category}
                        </h2>
                        <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                          {books.length}
                        </span>
                      </div>
                      <ChevronRight
                        className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-all duration-300"
                        style={{
                          transform:
                            expandedCategory === category
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          transitionProperty: "transform",
                        }}
                      />
                    </div>

                    {/* Books Display */}
                    {books.length === 0 ? (
                      <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                        <p className="text-slate-400">
                          No books found in this category
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {books.map((book, bookIdx) => (
                          <div
                            key={book._id}
                            className="group animate-fade-in"
                            style={{ animationDelay: `${bookIdx * 50}ms` }}
                          >
                            <div
                              className="relative h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-105 transform"
                              onClick={() => handleCardClick(book._id)}
                            >
                              {/* Gradient overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 to-transparent group-hover:from-blue-500/20 transition-all duration-300 pointer-events-none"></div>

                              <div className="p-4 h-full flex flex-col">
                                {/* Cover Image */}
                                {book.cover_image_url && (
                                  <div className="relative overflow-hidden rounded-lg mb-4 flex-shrink-0">
                                    <img
                                      src={book.cover_image_url}
                                      alt={book.title}
                                      className="h-40 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                                  </div>
                                )}

                                {/* Book Info */}
                                <div className="flex-1 flex flex-col">
                                  <h3 className="font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors mb-1">
                                    {book.title}
                                  </h3>
                                  <p className="text-sm text-slate-400 line-clamp-1 mb-3">
                                    {book.author}
                                  </p>

                                  {/* Meta Info */}
                                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4 mt-auto">
                                    <span className="px-2 py-1 bg-slate-700/50 rounded text-blue-400">
                                      {book.category || "Unknown"}
                                    </span>
                                    <span>{book.publication_year || "-"}</span>
                                  </div>
                                </div>

                                {/* Borrow Button */}
                                {/* <button
                                onClick={(e) => handleBorrowClick(book, e)}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                              >
                                Borrow Now
                              </button> */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Borrow Dialog
      {borrowDialogOpen && selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in" style={{ animationDelay: "50ms" }}>
            <h2 className="text-2xl font-bold text-white mb-2">{selectedBook.title}</h2>
            <p className="text-slate-400 mb-4">by {selectedBook.author}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select a Copy
              </label>
              {availableCopies.length > 0 ? (
                <select
                  value={selectedBarcode}
                  onChange={(e) => setSelectedBarcode(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Choose a copy...</option>
                  {availableCopies.map((copy) => (
                    <option key={copy._id} value={copy.barcode}>
                      {copy.barcode} - {copy.condition}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-slate-300 text-sm">No copies available</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBorrowDialogOpen(false);
                  setSelectedBook(null);
                  setSelectedBarcode("");
                }}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBorrow}
                disabled={borrowing || !selectedBarcode}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {borrowing ? "Confirming..." : "Confirm Borrow"}
              </button>
            </div>
          </div>
        </div>
      )} */}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
