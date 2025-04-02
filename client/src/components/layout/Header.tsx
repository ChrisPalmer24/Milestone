import { User, Settings, Link as LinkIcon, LogOut, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";

export default function Header() {
  const { logout } = useSession();
  // Track notification count (we'll just use a static number for now)
  const [notificationCount] = useState(2);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-neutral-700 hover:text-neutral-900 rounded-full p-1 hover:bg-gray-100">
              <User className="w-6 h-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/api-connections" className="cursor-pointer">
                  <LinkIcon className="w-4 h-4 mr-2" /> API Connections
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <h1 className="text-xl font-semibold text-neutral-900">Milestone</h1>
        </div>

        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-neutral-700 hover:text-neutral-900 rounded-full p-1 hover:bg-gray-100">
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-4 py-2 text-sm font-medium">Notifications</div>
              <DropdownMenuSeparator />
              <div className="px-4 py-2 text-sm">
                <div className="mb-2 pb-2 border-b border-gray-100">
                  <p className="font-medium">Account Value Increased</p>
                  <p className="text-gray-500 text-xs">Your ISA went up by 3.2% today</p>
                </div>
                <div>
                  <p className="font-medium">Milestone Approaching</p>
                  <p className="text-gray-500 text-xs">£42,861 more to reach £400k</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
