import { useEffect, useState } from "react";
import { borrowAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface BorrowRecord {
  borrow_id: string;
  user: string;
  book: string;
  copy: string;
  borrow_date: string;
  due_date: string;
  returned: boolean;
  condition?: string;
  remarks?: string;
}

export default function BorrowRecordsPage() {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [activePage, setActivePage] = useState(1);
  const [returnedPage, setReturnedPage] = useState(1);
  const pageSize = 5;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(
    null
  );
  const [fine, setFine] = useState<number | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let response;

      // If there is a search text, use the search API
      if (searchText.trim()) {
        const params = {
          barcode: searchText.trim(),

          status: activeTab === "active" ? "active" : "returned",
        };
        response = await borrowAPI.search(params);
        console.log(response.data);
        const data = response.data.results || [];
        setRecords(data);
      } else {
        // Otherwise, fetch all records
        response = await borrowAPI.list();
        const data = response.data.records || [];
        console.log(data);
        setRecords(data);
      }
    } catch (error) {
      toast.error("Failed to fetch borrow records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [searchText]);

  const activeRecords = records.filter((r) => !r.returned);
  const returnedRecords = records.filter((r) => r.returned);

  const getStatusBadge = (returned: boolean) =>
    returned ? (
      <Badge variant="secondary">Returned</Badge>
    ) : (
      <Badge variant="default">Borrowed</Badge>
    );

  const handleReturnClick = async (record: BorrowRecord) => {
    setSelectedRecord(record);
    setDialogOpen(true);
    setFine(null);

    // Call backend to calculate fine for this specific borrow
    try {
      const response = await borrowAPI.calculateFine(record.borrow_id);
      console.log(response.data);
      setFine(response.data.fine);
    } catch (error) {
      toast.error("Failed to calculate fine");
      setFine(0);
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;
    try {
      await borrowAPI.return({
        borrow_id: selectedRecord.borrow_id,
        condition: selectedRecord.condition,
        remarks: selectedRecord.remarks,
        fine_paid: selectedRecord.fine_paid || false,
      });

      toast.success("Book returned successfully");
      setDialogOpen(false);
      setSelectedRecord(null);
      setFine(null);
      fetchRecords();
    } catch (error) {
      toast.error("Failed to return book");
    }
  };

  const renderTable = (
    data: BorrowRecord[],
    page: number,
    setPage: (p: number) => void,
    showReturnButton = false,
    showExtraColumns = false,
    showFineColumn = true
  ) => {
    const pagedData = data.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="rounded-md border mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Borrow Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              {showFineColumn && <TableHead>Fine</TableHead>}
              {showExtraColumns && <TableHead>Condition</TableHead>}
              {showExtraColumns && <TableHead>Remarks</TableHead>}
              {showReturnButton && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array(pageSize)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    {Array(
                      showReturnButton
                        ? showExtraColumns
                          ? 9
                          : 7
                        : showExtraColumns
                        ? 8
                        : 6
                    )
                      .fill(0)
                      .map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      ))}
                  </TableRow>
                ))
            ) : pagedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    showReturnButton
                      ? showExtraColumns
                        ? 9
                        : 7
                      : showExtraColumns
                      ? 8
                      : 6
                  }
                  className="text-center text-muted-foreground"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((record) => (
                <TableRow key={record.borrow_id}>
                  <TableCell>{record.user}</TableCell>
                  <TableCell className="font-medium">{record.book}</TableCell>
                  <TableCell>{record.barcode}</TableCell>
                  <TableCell>
                    {format(new Date(record.borrow_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.due_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.returned)}</TableCell>
                  {showFineColumn && (
                    <TableCell>{record.fine || "0"}</TableCell>
                  )}
                  {showExtraColumns && (
                    <TableCell>{record.condition || "-"}</TableCell>
                  )}
                  {showExtraColumns && (
                    <TableCell>{record.remarks || "-"}</TableCell>
                  )}
                  {showReturnButton && (
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleReturnClick(record)}
                      >
                        Return
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data.length > pageSize && (
          <div className="flex justify-end space-x-2 p-2">
            <Button
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            <span className="flex items-center">
              Page {page} / {Math.ceil(data.length / pageSize)}
            </span>
            <Button
              size="sm"
              disabled={page === Math.ceil(data.length / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Borrow Records</h1>
          <p className="text-muted-foreground">
            Search and manage borrowing transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by username or barcode..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button onClick={fetchRecords} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Borrows</TabsTrigger>
          <TabsTrigger value="returned">Returned Borrows</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {renderTable(
            activeRecords,
            activePage,
            setActivePage,
            true,
            false,
            false
          )}
        </TabsContent>
        <TabsContent value="returned">
          {renderTable(
            returnedRecords,
            returnedPage,
            setReturnedPage,
            false,
            true,
            true
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <div className="space-y-4">
                  <p>
                    Are you sure you want to return the book:{" "}
                    <strong>{selectedRecord.book}</strong> (Copy ID:{" "}
                    {selectedRecord.copy})?
                  </p>
                  <p>
                    Borrow Date:{" "}
                    {format(
                      new Date(selectedRecord.borrow_date),
                      "MMM dd, yyyy"
                    )}
                  </p>
                  <p>
                    Due Date:{" "}
                    {format(new Date(selectedRecord.due_date), "MMM dd, yyyy")}
                  </p>

                  <hr className="my-2" />

                  <div className="space-y-2">
                    <label className="block font-medium">
                      Condition of Book
                    </label>
                    <Input
                      placeholder="Enter condition"
                      value={selectedRecord.condition || ""}
                      onChange={(e) =>
                        setSelectedRecord((prev) =>
                          prev ? { ...prev, condition: e.target.value } : prev
                        )
                      }
                    />

                    <label className="block font-medium">Remarks</label>
                    <Input
                      placeholder="Enter remarks"
                      value={selectedRecord.remarks || ""}
                      onChange={(e) =>
                        setSelectedRecord((prev) =>
                          prev ? { ...prev, remarks: e.target.value } : prev
                        )
                      }
                    />
                  </div>

                  <div className="mt-2">
                    <p className="font-semibold">Payment Summary:</p>
                    <p>
                      Total Fine: ₹{fine !== null ? fine : "Calculating..."}
                    </p>
                    <p>Returned Date: {format(new Date(), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn}>Confirm Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
