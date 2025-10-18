import { useEffect, useState } from "react";
import { booksAPI, borrowAPI } from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
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

export default function BookDetails() {
  // Get bookId from URL params
  const bookId =
    new URLSearchParams(window.location.search).get("bookId") ||
    window.location.pathname.split("/").pop();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [deliveryService, setDeliveryService] = useState<boolean>(false);

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchUserDetails();
    }
  }, [bookId]);

  // ✅ Fetch book details
  const fetchBook = async () => {
    setLoading(true);
    try {
      const response = await booksAPI.get(bookId!);
      setBook({ ...response.data });
    } catch (error) {
      toast.error("Failed to fetch book details");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch user details (role & delivery service)
  const fetchUserDetails = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      if (userData.role) setRole(userData.role.toLowerCase());
      if (typeof userData.delivery_service === "boolean")
        setDeliveryService(userData.delivery_service);
    } catch {
      console.warn("No user info found in localStorage");
    }
  };

  // ✅ Handle borrow or waitlist action
  const handleBorrowOrWaitlist = async () => {
    if (!book) return;
    setBorrowing(true);

    try {
      const response = await borrowAPI.borrow({ book_id: book._id });
      toast.success(response.data.message);
      fetchBook(); // refresh available copies after borrow
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Failed to process request";
      toast.error(message);
    } finally {
      setBorrowing(false);
    }
  };

  // ✅ Determine button visibility logic
  const canBorrow =
    role === "admin" ||
    role === "librarian" ||
    (role === "member" && deliveryService);

  const isAvailable =
    book && book.available_copies && book.available_copies > 0;

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
        {/* Header with back button */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors mb-8 group animate-fade-in"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Collection</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="h-96 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl animate-pulse"></div>
              <div className="md:col-span-2 space-y-4">
                <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse w-3/4"></div>
                <div className="space-y-3 mt-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded animate-pulse"
                      style={{ width: `${Math.random() * 40 + 60}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ) : !book ? (
            <div className="text-center py-20 animate-fade-in">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-xl font-medium text-white mb-6">
                Book not found
              </p>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
              {/* Book Cover */}
              <div className="md:col-span-1 group">
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 shadow-2xl hover:shadow-blue-500/20">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 to-transparent group-hover:from-blue-500/10 transition-all duration-300"></div>
                  {book.cover_image_url ? (
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-auto object-cover aspect-auto group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600">
                      <BookOpen className="w-16 h-16 text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Availability Badge */}
                <div className="mt-6 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    {isAvailable ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <div>
                          <p className="text-xs text-slate-400">
                            Available Copies
                          </p>
                          <p className="text-2xl font-bold text-green-400">
                            {book.available_copies}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Clock className="w-6 h-6 text-amber-400" />
                        <div>
                          <p className="text-xs text-slate-400">Status</p>
                          <p className="text-lg font-bold text-amber-400">
                            On Waitlist
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Title & Author */}
                <div
                  className="space-y-2 animate-fade-in"
                  style={{ animationDelay: "100ms" }}
                >
                  <h1 className="text-4xl font-bold text-white leading-tight">
                    {book.title}
                  </h1>
                  <p className="text-xl text-blue-400 font-semibold">
                    by {book.author}
                  </p>
                </div>

                {/* Details Grid */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in"
                  style={{ animationDelay: "150ms" }}
                >
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <Tag className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-slate-400 uppercase">ISBN</p>
                    </div>
                    <p className="text-white font-mono font-medium">
                      {book.isbn}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-slate-400 uppercase">
                        Category
                      </p>
                    </div>
                    <p className="text-white font-medium">
                      {book.category || "Unknown"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-slate-400 uppercase">
                        Publication Year
                      </p>
                    </div>
                    <p className="text-white font-medium">
                      {book.publication_year || "N/A"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <p className="text-xs text-slate-400 uppercase">Status</p>
                    </div>
                    <p className="text-white font-medium">
                      {isAvailable ? (
                        <span className="text-green-400">Available</span>
                      ) : (
                        <span className="text-amber-400">On Waitlist</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 animate-fade-in"
                  style={{ animationDelay: "200ms" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-300 uppercase">
                      Description
                    </h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-justify">
                    {book.description ||
                      "No description available for this book."}
                  </p>
                </div>

                {/* Action Button */}
                {canBorrow ? (
                  <button
                    onClick={handleBorrowOrWaitlist}
                    disabled={borrowing}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50 animate-fade-in"
                    style={{ animationDelay: "250ms" }}
                  >
                    {borrowing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : isAvailable ? (
                      "Borrow Book"
                    ) : (
                      "Add to Waitlist"
                    )}
                  </button>
                ) : (
                  <div
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-center animate-fade-in"
                    style={{ animationDelay: "250ms" }}
                  >
                    <p className="text-slate-300 font-medium">
                      {isAvailable ? (
                        <>
                          Available, but your library doesn't have the delivery
                          service enabled.
                        </>
                      ) : (
                        <>Not Available</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
