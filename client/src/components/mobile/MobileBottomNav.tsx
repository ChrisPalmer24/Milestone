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
      icon: <BarChart3 size={20} />,
    },
    {
      id: 'goals',
      path: '/goals',
      label: 'Goals',
      icon: <Target size={20} />,
    },
    {
      id: 'record',
      path: '/record',
      label: 'Record',
      icon: <CircleFadingPlus size={20} />,
    },
    {
      id: 'track',
      path: '/track',
      label: 'Track',
      icon: <LineChart size={20} />,
    },
    {
      id: 'fire',
      path: '/fire',
      label: 'FIRE',
      icon: <Flame size={20} />,
    },
  ];

  // Handle navigation with haptic feedback
  const handleNavClick = () => {
    triggerHapticFeedback();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl">
      <div className="grid grid-cols-5 w-full h-14">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Link 
              key={item.id}
              href={item.path}
              onClick={handleNavClick}
              className="flex flex-col items-center justify-center h-full w-full"
            >
              <div 
                className={`transition-colors flex justify-center items-center h-6 w-6 ${
                  isActive 
                    ? 'text-[#0061ff]' 
                    : 'text-black hover:text-[#0061ff]'
                }`}
              >
                {item.icon}
              </div>
              <div 
                className={`flex justify-center items-center text-xs mt-1 h-4 w-full ${
                  isActive 
                    ? 'text-[#0061ff] font-medium' 
                    : 'text-black hover:text-[#0061ff]'
                }`}
              >
                <span className="truncate max-w-[90%] text-center">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}