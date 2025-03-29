import { TrendingUp, Flag, LineChart, Flame, CircleFadingPlus } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils";

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
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    id: "goals",
    path: "/goals",
    label: "Goals",
    icon: <Flag className="w-6 h-6" />,
  },
  {
    id: "record",
    path: "/record",
    label: "Record",
    icon: <CircleFadingPlus className="w-6 h-6" />,
  },
  {
    id: "track",
    path: "/track",
    label: "Track",
    icon: <LineChart className="w-6 h-6" />,
  },
  {
    id: "fire",
    path: "/fire",
    label: "FIRE",
    icon: <Flame className="w-6 h-6" />,
  },
];

type BottomNavProps = {
  activeSection: string;
  onChange: (section: string) => void;
};

export default function BottomNav({ activeSection, onChange }: BottomNavProps) {
  const [location, setLocation] = useLocation();

  const handleNavigation = (item: NavItem) => {
    onChange(item.id);
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
                    (isActive || isActiveHome || activeSection === item.id) &&
                      "text-primary border-t-2 border-primary"
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
