import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Shield,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username.slice(0, 2).toUpperCase() || "U";
  };

  const getRoleInfo = () => {
    switch (user?.role?.toLowerCase()) {
      case "admin":
        return {
          label: "Admin",
          color: "from-red-500 to-pink-600",
          icon: Shield,
          bgColor: "bg-red-500/10",
          textColor: "text-red-400",
        };
      case "librarian":
        return {
          label: "Librarian",
          color: "from-blue-500 to-cyan-600",
          icon: BookOpen,
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-400",
        };
      default:
        return {
          label: "Member",
          color: "from-purple-500 to-violet-600",
          icon: UserIcon,
          bgColor: "bg-purple-500/10",
          textColor: "text-purple-400",
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70 shadow-lg">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Sidebar Trigger */}
        <div className="flex items-center">
          <SidebarTrigger className="text-slate-400 hover:text-blue-400 transition-colors" />
        </div>

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-4">
          {/* Role Badge */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${roleInfo.bgColor} border border-slate-700 hover:border-slate-600 transition-all group`}
          >
            <RoleIcon className={`w-4 h-4 ${roleInfo.textColor}`} />
            <span
              className={`text-xs font-semibold ${roleInfo.textColor} capitalize`}
            >
              {roleInfo.label}
            </span>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 px-3 rounded-lg hover:bg-slate-700/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={`bg-gradient-to-br ${roleInfo.color} text-white font-semibold text-sm`}
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <p className="text-sm font-semibold text-white leading-none">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </p>
                    <p
                      className={`text-xs ${roleInfo.textColor} leading-none capitalize`}
                    >
                      {roleInfo.label}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl rounded-xl"
            >
              {/* User Info Section */}
              <DropdownMenuLabel className="px-0">
                <div className="px-4 py-3 bg-gradient-to-r from-slate-700/50 to-transparent rounded-t-xl border-b border-slate-700/50">
                  <p className="text-sm font-semibold text-white">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <RoleIcon className={`w-3 h-3 ${roleInfo.textColor}`} />
                    <span
                      className={`text-xs font-semibold ${roleInfo.textColor} capitalize`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-slate-700/50" />

              {/* Menu Items */}
              <DropdownMenuItem
                onClick={() => navigate(`/profile/${user?.id}`)}
                className="cursor-pointer px-4 py-2.5 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 transition-all rounded-lg m-2 focus:bg-slate-700/50"
              >
                <UserIcon className="mr-3 h-4 w-4" />
                <span className="font-medium">View Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer px-4 py-2.5 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 transition-all rounded-lg m-2 focus:bg-slate-700/50"
              >
                <Settings className="mr-3 h-4 w-4" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-700/50" />

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all rounded-lg m-2 focus:bg-red-500/10"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Animated gradient line at bottom */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
    </header>
  );
};
