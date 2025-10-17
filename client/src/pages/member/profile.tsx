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

export default function MemberProfile() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState(null);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line
  }, [userId]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let profileRes, borrowsRes;
      // Admin/librarian can fetch for any user; member = self
      if (userId && (user?.role === "admin" || user?.role === "librarian")) {
        profileRes = await usersAPI.getUserProfile(userId);
        borrowsRes = await borrowAPI.borrowHistory({
          user_id: userId,
          page: 1,
          limit: 10,
        });
      } else {
        profileRes = await authAPI.getProfile();
        borrowsRes = await borrowAPI.borrowHistory({
          user_id: user.id,
          page: 1,
          limit: 10,
        });
      }
      setProfile(profileRes.data.user);
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
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.username?.[0]?.toUpperCase() || "U";
  };

  const getRoleBadge = (role = "member") => {
    const variants = {
      admin: "default",
      librarian: "secondary",
      member: "outline",
    };
    return (
      <Badge
        variant={variants[role.toLowerCase()] || "outline"}
        className="inline-flex gap-1 items-center text-base px-2"
      >
        <Shield className="inline-block w-4 h-4 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold flex gap-2 items-center">
          {userId ? "User Profile" : "My Profile"}
        </h1>
        <div className="text-muted-foreground text-base">
          Overview of user info and borrow history
        </div>
      </div>

      {/* Profile Card */}
      <Card className="shadow-sm">
        <CardHeader className="pt-6 pb-0">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={profile?.username} />
              <AvatarFallback className="text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold flex gap-1 justify-center items-center">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username}
                {getRoleBadge(profile?.role)}
              </h2>
              <p className="text-muted-foreground text-base mt-1">
                {profile?.email}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ProfileInfo
              icon={<User />}
              title="Username"
              value={profile?.username}
            />
            <ProfileInfo icon={<Mail />} title="Email" value={profile?.email} />
            {profile?.created_at && (
              <ProfileInfo
                icon={<Calendar />}
                title="Member Since"
                value={format(new Date(profile.created_at), "MMM dd, yyyy")}
              />
            )}
            {profile?.phone && (
              <ProfileInfo
                icon={<Phone />}
                title="Phone"
                value={profile.phone}
              />
            )}
            {profile?.address && (
              <ProfileInfo
                icon={<MapPin />}
                title="Address"
                value={profile.address}
                full
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- Active Borrows --- */}
      <SectionCard
        title="Active Borrows"
        subtitle="Books currently borrowed and not yet returned"
        emptyMessage="No active borrows"
      >
        <BorrowTable
          records={activeBorrows}
          columns={[
            { key: "book_title", label: "Book Title" },
            { key: "barcode", label: "Barcode", mono: true },
            { key: "borrow_date", label: "Borrow Date", date: true },
            { key: "due_date", label: "Due Date", date: true },
            { key: "status", label: "Status", badge: "Borrowed" },
          ]}
        />
      </SectionCard>

      {/* --- Returned Borrows --- */}
      <SectionCard
        title="Returned Books"
        subtitle="Books returned in the past"
        emptyMessage="No returned books"
      >
        <BorrowTable
          records={returnedBorrows}
          columns={[
            { key: "book_title", label: "Book Title" },
            { key: "barcode", label: "Barcode", mono: true },
            { key: "borrow_date", label: "Borrow Date", date: true },
            { key: "return_date", label: "Return Date", date: true },
            { key: "fine", label: "Fine" },
            { key: "condition_on_return", label: "Condition" },
            { key: "remarks", label: "Remarks", truncate: true },
          ]}
        />
      </SectionCard>
    </div>
  );
}

// --- Helper Components ---

function ProfileInfo({ icon, title, value, full = false }) {
  return (
    <div
      className={`flex items-center space-x-3 ${full ? "md:col-span-2" : ""}`}
    >
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="font-medium">{value || "-"}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, emptyMessage, children }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="text-muted-foreground text-sm pl-1">{subtitle}</div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {children}
        {/* Only show empty message if children renders no records */}
        {Array.isArray(children?.props?.records) &&
          children.props.records.length === 0 && (
            <div className="mt-2 text-muted-foreground text-center">
              {emptyMessage}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function BorrowTable({ records, columns }) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted text-base">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.mono ? "font-mono text-xs" : ""}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground"
              >
                No records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((rec) => (
              <TableRow
                key={rec._id}
                className="hover:bg-accent transition-all"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={`${col.mono ? "font-mono text-xs" : ""} ${
                      col.truncate ? "max-w-xs truncate" : ""
                    }`}
                  >
                    {col.badge ? (
                      <Badge variant="default">{col.badge}</Badge>
                    ) : col.date && rec[col.key] ? (
                      format(new Date(rec[col.key]), "MMM dd, yyyy")
                    ) : (
                      rec[col.key] || (col.truncate ? "-" : "")
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
