import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Library, BookOpen, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (user && !hasRedirected) {
      const redirectPath =
        user.role === "admin"
          ? "/admin/dashboard"
          : user.role === "librarian"
          ? "/librarian/dashboard"
          : "/member/browse";
      navigate(redirectPath, { replace: true });
      setHasRedirected(true);
    }
  }, [user, navigate, hasRedirected]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Library className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LibraryMS</span>
          </div>
          <div className="flex gap-2">
            <Link to="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Modern Library Management
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Streamline your library operations with our powerful SaaS platform.
            Manage books, users, and borrowing seamlessly.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="min-w-[200px]">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm animate-slide-up">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Book Management</h3>
            <p className="text-muted-foreground">
              Easily manage your entire book collection with powerful search and
              organization tools.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm animate-slide-up [animation-delay:100ms]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">User Roles</h3>
            <p className="text-muted-foreground">
              Role-based access for admins, librarians, and members with
              tailored experiences.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm animate-slide-up [animation-delay:200ms]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Secure & Scalable</h3>
            <p className="text-muted-foreground">
              Built with security in mind and ready to scale from small
              libraries to large institutions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
