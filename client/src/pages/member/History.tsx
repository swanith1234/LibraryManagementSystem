import { useEffect, useState } from "react";
import { usersAPI } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface BorrowRecord {
  _id: string;
  book_title: string;
  barcode: string;
  borrow_date: string;
  return_date?: string;
  status: string;
}

export default function MemberHistory() {
  const [history, setHistory] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getBorrowedBooks();
      console.log("history", response);
      setHistory(response.data.borrowed_books);
    } catch (error) {
      toast.error("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "borrowed":
        return <Badge variant="default">Borrowed</Badge>;
      case "returned":
        return <Badge variant="secondary">Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Borrow History</h1>
          <p className="text-muted-foreground">
            View your complete borrowing history
          </p>
        </div>
        <Button onClick={fetchHistory} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Borrow Date</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No borrow history found
                </TableCell>
              </TableRow>
            ) : (
              history.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {record.book_title}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {record.barcode}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.borrow_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {record.return_date
                      ? format(new Date(record.return_date), "MMM dd, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
