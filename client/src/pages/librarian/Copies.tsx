import { useEffect, useState } from "react";
import { copiesAPI, booksAPI, borrowAPI, usersAPI } from "@/lib/api"; // ✅ include borrowAPI & usersAPI
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, RefreshCw, Hand } from "lucide-react"; // ✅ added Hand icon
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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

interface BookCopy {
  id: string;
  book_id: string;
  book_title: string;
  barcode: string;
  is_available: boolean;
  condition: string;
}

interface Book {
  id: string;
  title: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function LibrarianCopies() {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);
  const [deleteCopyId, setDeleteCopyId] = useState<string | null>(null);
  const [lendDialogOpen, setLendDialogOpen] = useState(false); // ✅ NEW
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null); // ✅ NEW
  const [userSearch, setUserSearch] = useState(""); // ✅ NEW
  const [userResults, setUserResults] = useState<User[]>([]); // ✅ NEW
  const [userLoading, setUserLoading] = useState(false); // ✅ NEW

  const [formData, setFormData] = useState({
    book_id: "",
    barcode: "",
    condition: "good",
    is_available: true,
  });

  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [copiesRes, booksRes] = await Promise.all([
        copiesAPI.list(),
        booksAPI.list(),
      ]);
      setCopies(copiesRes.data.items);
      setBooks(booksRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCopies = async () => {
    setLoading(true);
    try {
      const res = await copiesAPI.list({
        search: searchText,
        page,
        page_size: pageSize,
      });
      const data = res.data || res;
      setCopies(data.items || data);
      console.log("data", data);
      setTotalPages(
        data.total_pages || Math.ceil((data.total || data.length) / pageSize)
      );
    } catch (error) {
      toast.error("Failed to fetch copies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopies();
  }, [searchText, page]);

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ NEW: Handle user search
  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    setUserLoading(true);
    try {
      console.log("Searching users with query:", query);
      const res = await usersAPI.search(query); // expects ?search=username
      console.log(res.data);
      setUserResults(res.data.users || res.data || []);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setUserLoading(false);
    }
  };

  // ✅ NEW: Lend copy to selected user
  const handleLend = async (userId: string) => {
    console.log("Lending copy to user ID:", userId);
    console.log("Selected copy:", selectedCopy);
    if (!selectedCopy) return;
    try {
      await borrowAPI.borrow({
        user_id: userId,
        copy_id: selectedCopy.id,
      });
      toast.success("Book copy lent successfully!");
      setLendDialogOpen(false);
      fetchCopies();
    } catch (error) {
      toast.error("Failed to lend copy");
    }
  };

  const handleOpenDialog = (copy?: BookCopy) => {
    if (copy) {
      setEditingCopy(copy);
      setFormData({
        book_id: copy.book_id,
        barcode: copy.barcode,
        condition: copy.condition,
        is_available: copy.is_available,
      });
    } else {
      setEditingCopy(null);
      setFormData({
        book_id: "",
        barcode: "",
        condition: "good",
        is_available: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCopy) {
        await copiesAPI.update(editingCopy.id, formData);
        toast.success("Copy updated successfully");
      } else {
        await copiesAPI.create(formData);
        toast.success("Copy created successfully");
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error(
        editingCopy ? "Failed to update copy" : "Failed to create copy"
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteCopyId) return;
    try {
      await copiesAPI.delete(deleteCopyId);
      toast.success("Copy deleted successfully");
      setDeleteCopyId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete copy");
    }
  };

  const getStatusBadge = (is_available: boolean) => {
    switch (is_available) {
      case true:
        return <Badge variant="secondary">Available</Badge>;
      case false:
        return <Badge variant="default">Borrowed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book Copies</h1>
          <p className="text-muted-foreground">Manage physical book copies</p>
        </div>
        <Input
          placeholder="Search by title, barcode, category..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Copy
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book Title</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : copies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No copies found
                </TableCell>
              </TableRow>
            ) : (
              copies.map((copy) => (
                <TableRow key={copy.id}>
                  <TableCell className="font-medium">
                    {copy.book_title}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {copy.barcode}
                  </TableCell>
                  <TableCell className="capitalize">{copy.condition}</TableCell>
                  <TableCell>{getStatusBadge(copy.is_available)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {copy.is_available === true && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCopy(copy);
                            setLendDialogOpen(true);
                          }}
                        >
                          <Hand className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(copy)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCopyId(copy.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ NEW: Lend Dialog */}
      <Dialog open={lendDialogOpen} onOpenChange={setLendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lend Book Copy</DialogTitle>
            <DialogDescription>
              Search for a user to lend this copy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search by username..."
              value={userSearch}
              onChange={(e) => handleUserSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {userLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : userResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                userResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleLend(user.id)}
                  >
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLendDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
