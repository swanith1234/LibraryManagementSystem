import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usersAPI, booksAPI, borrowAPI } from "@/lib/api";
import { Users, BookOpen, BookMarked, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  activeBorrows: number;
  totalBorrows: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBooks: 0,
    activeBorrows: 0,
    totalBorrows: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, booksRes, borrowsRes] = await Promise.all([
          usersAPI.list(),
          booksAPI.list(),
          borrowAPI.list(),
        ]);

        const activeBorrows = borrowsRes.data.records.filter(
          (b: any) => b.status === "borrowed"
        ).length;

        setStats({
          totalUsers: usersRes.data.users.length,
          totalBooks: booksRes.data.length,
          activeBorrows,
          totalBorrows: borrowsRes.data.records.length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Total Books",
      value: stats.totalBooks,
      icon: BookOpen,
      description: "Books in library",
    },
    {
      title: "Active Borrows",
      value: stats.activeBorrows,
      icon: BookMarked,
      description: "Currently borrowed",
    },
    {
      title: "Total Transactions",
      value: stats.totalBorrows,
      icon: TrendingUp,
      description: "All-time borrows",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your library system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
