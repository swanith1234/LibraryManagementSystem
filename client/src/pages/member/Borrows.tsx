import { useEffect, useState } from "react";
import { borrowAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface BorrowRecord {
  _id?: string;
  book_title: string;
  barcode: string;
  borrow_date: string;
  return_date?: string;
  fine?: number;
}

export default function MemberBorrows() {
  const [activeBorrows, setActiveBorrows] = useState<BorrowRecord[]>([]);
  const [returnedBooks, setReturnedBooks] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const response = await borrowAPI.memberSummary();
      console.log("records", response);

      const { active_borrows = [], returned_books = [] } = response.data;
      setActiveBorrows(active_borrows);
      setReturnedBooks(returned_books);
    } catch (error) {
      toast.error("Failed to fetch your borrows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Borrows</h1>
          <p className="text-muted-foreground">
            View your borrowed and returned books
          </p>
        </div>
        <Button onClick={fetchBorrows} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Borrows Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Active Borrows</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : activeBorrows.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookMarked className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No active borrows</p>
            <p className="text-sm text-muted-foreground">
              Browse books to start borrowing
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeBorrows.map((borrow, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">
                        {borrow.book_title}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {borrow.barcode}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Borrowed</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Borrowed: </span>
                    {format(new Date(borrow.borrow_date), "MMM dd, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Returned Books Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Returned Books</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : returnedBooks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookMarked className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No returned books yet</p>
            <p className="text-sm text-muted-foreground">
              Your returned books will appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {returnedBooks.map((borrow, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">
                        {borrow.book_title}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {borrow.barcode}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Returned</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Borrowed: </span>
                    {format(new Date(borrow.borrow_date), "MMM dd, yyyy")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Returned: </span>
                    {format(new Date(borrow.return_date || ""), "MMM dd, yyyy")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Fine: </span>₹
                    {borrow.fine ?? 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
