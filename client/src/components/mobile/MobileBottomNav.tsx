import { useLocation, Link } from 'wouter';
import { BarChart3, LineChart, Target, Flame, CircleFadingPlus } from 'lucide-react';
import { triggerHapticFeedback } from '../../capacitor';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobilePlatform } from '@/hooks/use-mobile-platform';

type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
};

export default function MobileBottomNav() {
  const [location] = useLocation();
  const isMobileViewport = useIsMobile();
  const isMobilePlatform = useMobilePlatform();
  
  // Only render on mobile viewports or native mobile platforms
  if (!isMobileViewport && !isMobilePlatform) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'portfolio',
      path: '/portfolio',
      label: 'Portfolio',
      icon: <BarChart3 size={24} />,
    },
    {
      id: 'goals',
      path: '/goals',
      label: 'Goals',
      icon: <Target size={24} />,
    },
    {
      id: 'record',
      path: '/record',
      label: 'Record',
      icon: <CircleFadingPlus size={24} />,
    },
    {
      id: 'track',
      path: '/track',
      label: 'Track',
      icon: <LineChart size={24} />,
    },
    {
      id: 'fire',
      path: '/fire',
      label: 'FIRE',
      icon: <Flame size={24} />,
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
                className={`p-1 transition-colors ${
                  isActive 
                    ? 'text-[#0061ff]' 
                    : 'text-black hover:text-[#0061ff]'
                }`}
              >
                {item.icon}
              </div>
              <span 
                className={`text-xs mt-0.5 ${
                  isActive 
                    ? 'text-[#0061ff] font-medium' 
                    : 'text-black hover:text-[#0061ff]'
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