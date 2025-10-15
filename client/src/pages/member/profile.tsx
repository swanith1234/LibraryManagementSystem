import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authAPI, usersAPI, borrowAPI } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { User, Mail, Shield, Calendar, Phone, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

interface BorrowRecord {
  _id: string;
  book_title: string;
  barcode: string;
  borrow_date: string;
  due_date?: string;
  return_date?: string;
  status: string;
  returned?: boolean;
  fine?: number;
  condition_on_return?: string;
  remarks?: string;
}

export default function MemberProfile() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let profileRes, borrowsRes;

      // 🔹 If admin or librarian — fetch specific user's profile
      if (userId && (user?.role === "admin" || user?.role === "librarian")) {
        profileRes = await usersAPI.getUserProfile(userId);
        borrowsRes = await borrowAPI.borrowHistory(userId, 1, 10);
      } else {
        // 🔹 If member — fetch their own profile
        profileRes = await authAPI.getProfile();
        console.log("Fetching own profile", profileRes);
        borrowsRes = await borrowAPI.borrowHistory(user?.id, 1, 10);
        console.log("b", borrowsRes);
      }

      setProfile(profileRes.data);
      console.log(borrowsRes.data);
      setBorrowRecords(borrowsRes.data.records || borrowsRes.data);
    } catch (error) {
      toast.error("Failed to fetch profile data");
    } finally {
      setLoading(false);
    }
  };

  const activeBorrows = borrowRecords.filter(
    (b) => !b.returned && b.status === "borrowed"
  );
  const returnedBorrows = borrowRecords.filter(
    (b) => b.returned || b.status === "returned"
  );

  const getInitials = () => {
    console.log("pro", profile);
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }

    return profile?.username?.[0]?.toUpperCase() || "U";
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      librarian: "secondary",
      member: "outline",
    };
    return (
      <Badge variant={variants[role.toLowerCase()] || "outline"}>{role}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-40 mx-auto mt-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {userId ? "User Profile" : "My Profile"}
      </h1>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={profile?.username} />
              <AvatarFallback className="text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username}
              </h2>
              <p className="text-muted-foreground">{profile?.email}</p>
              <div className="mt-2">
                {getRoleBadge(profile?.role || "member")}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{profile?.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>

            {profile?.created_at && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {format(new Date(profile.created_at), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}

            {profile?.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}

            {profile?.address && (
              <div className="flex items-center space-x-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{profile.address}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Borrows */}
      <Card>
        <CardHeader>
          <CardTitle>Active Borrows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Borrow Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeBorrows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No active borrows
                    </TableCell>
                  </TableRow>
                ) : (
                  activeBorrows.map((record) => (
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
                        {record.due_date
                          ? format(new Date(record.due_date), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Borrowed</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Returned Borrows */}
      <Card>
        <CardHeader>
          <CardTitle>Returned Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Borrow Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnedBorrows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No returned books
                    </TableCell>
                  </TableRow>
                ) : (
                  returnedBorrows.map((record) => (
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
                      <TableCell>
                        {record.fine ? `$${record.fine.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>{record.condition_on_return || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.remarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
