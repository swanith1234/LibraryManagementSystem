import { useEffect, useState } from "react";
import { authAPI, usersAPI, borrowAPI } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Phone,
  MapPin,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MemberProfile({ userId }: { userId?: string }) {
  const { user } = useAuth();

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

  const getRoleColors = (role = "member") => {
    switch (role?.toLowerCase()) {
      case "admin":
        return {
          bg: "from-red-500 to-pink-600",
          badge: "bg-red-500/10 text-red-400 border-red-500/30",
          icon: Shield,
        };
      case "librarian":
        return {
          bg: "from-blue-500 to-cyan-600",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: BookOpen,
        };
      default:
        return {
          bg: "from-purple-500 to-violet-600",
          badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          icon: User,
        };
    }
  };

  const roleColors = getRoleColors(profile?.role);
  const RoleIcon = roleColors.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-10 w-48 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              {userId ? "User Profile" : "My Profile"}
            </h1>
            <p className="text-slate-400 text-lg">
              View profile information and borrowing history
            </p>
          </div>

          {/* Profile Card */}
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 shadow-2xl animate-fade-in"
            style={{ animationDelay: "50ms" }}
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-6">
                <Avatar className="h-32 w-32 border-4 border-slate-700">
                  <AvatarImage src="" alt={profile?.username} />
                  <AvatarFallback
                    className={`text-4xl font-bold bg-gradient-to-br ${roleColors.bg} text-white`}
                  >
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-0 right-0 p-3 rounded-full ${roleColors.badge} border`}
                >
                  <RoleIcon className="w-5 h-5" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-1">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username}
              </h2>
              <p className="text-slate-400 mb-4">{profile?.email}</p>
              <div
                className={`px-4 py-2 rounded-lg font-semibold capitalize ${roleColors.badge} border`}
              >
                {profile?.role}
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-700 pt-8">
              <ProfileInfo
                icon={<User />}
                title="Username"
                value={profile?.username}
              />
              <ProfileInfo
                icon={<Mail />}
                title="Email"
                value={profile?.email}
              />
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
              <ProfileInfo
                icon={<BookOpen />}
                title="Total Borrows"
                value={borrowRecords.length.toString()}
              />
            </div>
          </div>

          {/* Active Borrows Section */}
          <SectionCard
            title="Active Borrows"
            subtitle="Books currently borrowed and not yet returned"
            icon={<Clock className="w-5 h-5" />}
            count={activeBorrows.length}
            accentColor="blue"
            animationDelay="100ms"
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
              emptyMessage="No active borrows"
            />
          </SectionCard>

          {/* Returned Books Section */}
          <SectionCard
            title="Returned Books"
            subtitle="Books returned in the past"
            icon={<CheckCircle className="w-5 h-5" />}
            count={returnedBorrows.length}
            accentColor="green"
            animationDelay="150ms"
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
              emptyMessage="No returned books"
            />
          </SectionCard>
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

// --- Helper Components ---

function ProfileInfo({ icon, title, value, full = false }) {
  return (
    <div
      className={`flex items-start space-x-3 p-3 rounded-lg bg-slate-700/30 border border-slate-700/50 hover:border-slate-600/50 transition-all ${
        full ? "md:col-span-2 lg:col-span-3" : ""
      }`}
    >
      <span className="text-blue-400 flex-shrink-0 mt-1">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400 uppercase font-semibold">
          {title}
        </div>
        <div className="font-medium text-white mt-1 truncate">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  count,
  accentColor,
  animationDelay,
  children,
}) {
  const accentColors = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-green-500 to-emerald-600",
    purple: "from-purple-500 to-violet-600",
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay }}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="px-6 py-6 bg-gradient-to-r from-slate-800/50 to-transparent border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${accentColors[accentColor]} text-white`}
              >
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400">{subtitle}</p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg bg-gradient-to-br ${accentColors[accentColor]} text-white font-semibold text-lg`}
            >
              {count}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function BorrowTable({ records, columns, emptyMessage }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 overflow-x-auto bg-slate-700/20">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-700/50 hover:bg-slate-700/50 border-slate-700">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={`text-slate-300 font-semibold ${
                  col.mono ? "font-mono text-xs" : ""
                }`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((rec) => (
            <TableRow
              key={rec._id}
              className="border-slate-700 hover:bg-slate-700/30 transition-colors"
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={`text-slate-300 ${
                    col.mono ? "font-mono text-xs" : ""
                  } ${col.truncate ? "max-w-xs truncate" : ""}`}
                >
                  {col.badge ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium text-sm">
                      {col.badge}
                    </span>
                  ) : col.date && rec[col.key] ? (
                    format(new Date(rec[col.key]), "MMM dd, yyyy")
                  ) : (
                    rec[col.key] || (col.truncate ? "-" : "")
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
