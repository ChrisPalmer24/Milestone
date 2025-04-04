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

// Define notification interface
interface Notification {
  id: number | string;
  title: string;
  message: string;
  isRead: boolean;
  isNew?: boolean;
}

export default function Header() {
  const { logout } = useSession();
  // Track notification count and items
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Account Value Increased",
      message: "Your ISA went up by 3.2% today",
      isRead: false,
      isNew: false
    },
    {
      id: 2,
      title: "Milestone Approaching",
      message: "£42,861 more to reach £400k",
      isRead: false,
      isNew: false
    }
  ]);
  
  // Compute notification count based on unread items
  const notificationCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  // Mark a notification as read
  const markAsRead = (id: number | string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };
  
  // Add a new notification (for testing animation)
  const addNotification = () => {
    // Sample notification titles and messages
    const titles = [
      "Portfolio milestone reached",
      "Monthly summary available",
      "Account growth update",
      "Investment opportunity"
    ];
    
    const messages = [
      "Your portfolio is up 5% this month",
      "Check your monthly performance report",
      "One of your accounts has grown significantly",
      "Consider rebalancing your portfolio"
    ];
    
    // Generate random notification
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create new notification with unique ID
    const newNotification = {
      id: Date.now(), // Use timestamp as unique ID
      title: randomTitle,
      message: randomMessage,
      isRead: false,
      isNew: true // Flag as new for animation
    };
    
    // Add to notifications list
    setNotifications([newNotification, ...notifications]);
    
    // After 500ms, remove the "new" flag to stop the animation
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === newNotification.id ? { ...n, isNew: false } : n)
      );
    }, 500);
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
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center notification-badge">
                  {notificationCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex justify-between items-center px-4 py-2">
                <div className="text-sm font-medium">Notifications</div>
                {notificationCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              
              <div className="px-2 py-1 max-h-80 overflow-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`mb-2 p-2 rounded-md text-sm cursor-pointer transition-colors ${
                        notification.isRead 
                          ? 'bg-gray-50' 
                          : 'bg-blue-50 hover:bg-blue-100'
                      } ${notification.isNew ? 'notification-item-new' : ''}`}
                    >
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-gray-500 text-xs">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No new notifications
                  </div>
                )}
                
                {/* Test button - only visible in development */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dropdown from closing
                    addNotification();
                  }}
                  className="w-full mt-2 py-1 px-2 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Simulate new notification
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
