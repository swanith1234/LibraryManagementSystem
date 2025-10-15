import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { booksAPI, borrowAPI, copiesAPI } from '@/lib/api';
import { BookOpen, BookMarked, Library, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibrarianDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCopies: 0,
    activeBorrows: 0,
    availableCopies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [booksRes, copiesRes, borrowsRes] = await Promise.all([
          booksAPI.list(),
          copiesAPI.list(),
          borrowAPI.list(),
        ]);

        const activeBorrows = borrowsRes.data.filter((b: any) => b.status === 'borrowed').length;
        const availableCopies = copiesRes.data.filter((c: any) => c.status === 'available').length;

        setStats({
          totalBooks: booksRes.data.length,
          totalCopies: copiesRes.data.length,
          activeBorrows,
          availableCopies,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      description: 'Unique book titles',
    },
    {
      title: 'Total Copies',
      value: stats.totalCopies,
      icon: Library,
      description: 'Physical copies',
    },
    {
      title: 'Active Borrows',
      value: stats.activeBorrows,
      icon: BookMarked,
      description: 'Currently borrowed',
    },
    {
      title: 'Available Copies',
      value: stats.availableCopies,
      icon: AlertCircle,
      description: 'Ready to borrow',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Librarian Dashboard</h1>
        <p className="text-muted-foreground">Manage library operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
