import { BarChart3, Flag, LineChart, Flame, CircleFadingPlus } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/context/PortfolioContext";
import { triggerHapticFeedback } from "@/capacitor";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobilePlatform } from "@/hooks/use-mobile-platform";

type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    id: "portfolio",
    path: "/portfolio",
    label: "Portfolio",
    icon: <BarChart3 size={20} />,
  },
  {
    id: "goals",
    path: "/goals",
    label: "Goals",
    icon: <Flag size={20} />,
  },
  {
    id: "record",
    path: "/record",
    label: "Record",
    icon: <CircleFadingPlus size={20} />,
  },
  {
    id: "track",
    path: "/track",
    label: "Track",
    icon: <LineChart size={20} />,
  },
  {
    id: "fire",
    path: "/fire",
    label: "FIRE",
    icon: <Flame size={20} />,
  },
];

// Optional props for when component is used directly
type BottomNavProps = {
  activeSection?: string;
  onChange?: (section: string) => void;
};

export default function BottomNav({ activeSection, onChange }: BottomNavProps = {}) {
  const [location, setLocation] = useLocation();
  // If props are not provided, get values from context
  const portfolio = usePortfolio();
  const activeNav = activeSection || portfolio.activeSection;
  const onChangeNav = onChange || portfolio.setActiveSection;

  // Handle navigation with haptic feedback on mobile devices
  const handleNavigation = (item: NavItem) => {
    triggerHapticFeedback();
    onChangeNav(item.id);
    setLocation(item.path);
  };

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-10">
      <div className="max-w-5xl mx-auto">
        <ul className="flex justify-between">
          {navItems.map((item) => {
            const [isActive] = useRoute(item.path);
            const isActiveHome = location === "/" && item.id === "portfolio";

            return (
              <li key={item.id} className="flex-1">
                <button
                  className={cn(
                    "nav-item flex flex-col items-center pt-2 pb-1 w-full",
                    (isActive || isActiveHome || activeNav === item.id)
                      ? "text-[#0061ff]"
                      : ""
                  )}
                  onClick={() => handleNavigation(item)}
                  aria-label={item.label}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
