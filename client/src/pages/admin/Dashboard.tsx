import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, BookMarked, TrendingUp, Clock } from "lucide-react";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { dashboardAPI, usersAPI } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  activeBorrows: number;
  totalBorrows: number;
  newUsersLast30Days: number;
  avgBorrowDuration: number;
}

interface BorrowTrend {
  date: string;
  borrows: number;
  returns: number;
  overdue: number;
}

interface TopBook {
  title: string;
  borrow_count: number;
}

interface RoleDistribution {
  [role: string]: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBooks: 0,
    activeBorrows: 0,
    totalBorrows: 0,
    newUsersLast30Days: 0,
    avgBorrowDuration: 0,
  });

  const [borrowStatus, setBorrowStatus] = useState({
    active: 0,
    returned: 0,
    overdue: 0,
  });
  const [borrowTrend, setBorrowTrend] = useState<BorrowTrend[]>([]);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await usersAPI.summary();
        const data = res.data;

        // Update stats
        setStats({
          totalUsers: data.total_users,
          totalBooks: data.total_books,
          activeBorrows: data.active_borrows,
          totalBorrows: data.total_transactions,
          newUsersLast30Days: data.new_users_last_30_days,
          avgBorrowDuration: data.avg_borrow_duration,
        });

        setBorrowStatus(data.status_distribution);
        setBorrowTrend(data.borrow_trend);
        setTopBooks(data.top_books);
        setRoleDistribution(data.role_distribution);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "New Users (30 Days)",
      value: stats.newUsersLast30Days,
      icon: Users,
      description: "Registered in last 30 days",
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
    {
      title: "Avg Borrow Duration",
      value: stats.avgBorrowDuration,
      icon: Clock,
      description: "Average days borrowed",
    },
  ];

  // -----------------------------
  // Pie: Borrow Status
  // -----------------------------
  const pieData = {
    labels: ["Active", "Returned", "Overdue"],
    datasets: [
      {
        data: [
          borrowStatus.active,
          borrowStatus.returned,
          borrowStatus.overdue,
        ],
        backgroundColor: ["#4caf50", "#2196f3", "#f44336"],
      },
    ],
  };

  // -----------------------------
  // Line: Borrow vs Return Trend
  // -----------------------------
  const lineData = {
    labels: borrowTrend.map((b) => b.date),
    datasets: [
      {
        label: "Borrows",
        data: borrowTrend.map((b) => b.borrows),
        borderColor: "#4caf50",
        backgroundColor: "#4caf50",
        tension: 0.4,
      },
      {
        label: "Returns",
        data: borrowTrend.map((b) => b.returns),
        borderColor: "#2196f3",
        backgroundColor: "#2196f3",
        tension: 0.4,
      },
      {
        label: "Overdue",
        data: borrowTrend.map((b) => b.overdue),
        borderColor: "#f44336",
        backgroundColor: "#f44336",
        tension: 0.4,
      },
    ],
  };

  // -----------------------------
  // Bar: Top Borrowed Books
  // -----------------------------
  const barData = {
    labels: topBooks.map((b) => b.title),
    datasets: [
      {
        label: "Borrow Count",
        data: topBooks.map((b) => b.borrow_count),
        backgroundColor: "#ff9800",
      },
    ],
  };

  // -----------------------------
  // Pie: Role Distribution
  // -----------------------------
  const rolePieData = {
    labels: Object.keys(roleDistribution),
    datasets: [
      {
        data: Object.values(roleDistribution),
        backgroundColor: [
          "#4caf50",
          "#2196f3",
          "#f44336",
          "#ff9800",
          "#9c27b0",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your library system</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Borrow Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Pie data={pieData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Borrow vs Return Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Line data={lineData} />
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 Borrowed Books</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Bar data={barData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Pie data={rolePieData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
