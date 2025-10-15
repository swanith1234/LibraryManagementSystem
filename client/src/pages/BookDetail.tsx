import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { booksAPI, borrowAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [deliveryService, setDeliveryService] = useState<boolean>(false);

  useEffect(() => {
    fetchBook();
    fetchUserDetails();
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

  if (loading) return <Skeleton className="h-96 w-full" />;

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Book not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  // ✅ Determine button visibility logic
  const canBorrow =
    role === "admin" ||
    role === "librarian" ||
    (role === "member" && deliveryService);

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        Back
      </Button>

      <Card className="max-w-4xl mx-auto shadow-md border border-gray-200">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{book.title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            by {book.author}
          </CardDescription>
          <Badge variant={book.available_copies! > 0 ? "secondary" : "outline"}>
            {book.available_copies} available
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {book.cover_image_url && (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-64 object-cover rounded"
            />
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>ISBN:</strong> {book.isbn}
            </p>
            <p>
              <strong>Category:</strong> {book.category || "Unknown"}
            </p>
            <p>
              <strong>Publication Year:</strong> {book.publication_year || "-"}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {book.description || "No description available."}
            </p>
          </div>

          {canBorrow ? (
            <Button
              onClick={handleBorrowOrWaitlist}
              disabled={borrowing}
              className="w-full sm:w-auto"
            >
              {borrowing
                ? "Processing..."
                : book.available_copies && book.available_copies > 0
                ? "Borrow Book"
                : "Add to Waitlist"}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground font-medium">
              {book.available_copies && book.available_copies > 0
                ? "Available"
                : "Not Available"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
