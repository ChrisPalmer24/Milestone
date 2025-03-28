import { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { Home, BarChart3, LineChart, Target, Settings } from 'lucide-react';
import { triggerHapticFeedback, isNativePlatform } from '../../capacitor';

type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
};

export default function MobileBottomNav() {
  const [location] = useLocation();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Check if running on a mobile device
  useEffect(() => {
    setIsMobileDevice(isNativePlatform());
  }, []);

  // If not on a mobile device, don't render
  if (!isMobileDevice) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'home',
      path: '/',
      label: 'Home',
      icon: <Home size={24} />,
    },
    {
      id: 'portfolio',
      path: '/portfolio',
      label: 'Portfolio',
      icon: <BarChart3 size={24} />,
    },
    {
      id: 'track',
      path: '/track',
      label: 'Track',
      icon: <LineChart size={24} />,
    },
    {
      id: 'goals',
      path: '/goals',
      label: 'Goals',
      icon: <Target size={24} />,
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: <Settings size={24} />,
    },
  ];

  // Handle navigation with haptic feedback
  const handleNavClick = () => {
    triggerHapticFeedback();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl">
      <div className="flex items-center justify-between px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Link 
              key={item.id}
              href={item.path}
              onClick={handleNavClick}
              className="flex flex-1 flex-col items-center py-2"
            >
              <div 
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.icon}
              </div>
              <span 
                className={`text-xs mt-1 ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}