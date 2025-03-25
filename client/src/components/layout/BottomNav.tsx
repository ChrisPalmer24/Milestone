import { 
  TrendingUp, 
  Flag, 
  ClipboardEdit, 
  LineChart, 
  Flame 
} from "lucide-react";
import { useLocation } from "wouter";
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
    icon: <TrendingUp className="w-6 h-6" /> 
  },
  { 
    id: "goals", 
    path: "/goals",
    label: "Goals", 
    icon: <Flag className="w-6 h-6" /> 
  },
  { 
    id: "record", 
    path: "/record",
    label: "Record", 
    icon: <ClipboardEdit className="w-6 h-6" /> 
  },
  { 
    id: "track", 
    path: "/track",
    label: "Track", 
    icon: <LineChart className="w-6 h-6" /> 
  },
  { 
    id: "fire", 
    path: "/fire",
    label: "FIRE", 
    icon: <Flame className="w-6 h-6" /> 
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
            // Simplify the active state check to reduce hook issues
            const isActive = location === item.path || 
                            (location === "/" && item.id === "portfolio") || 
                            activeSection === item.id;
            
            return (
              <li key={item.id} className="flex-1">
                <button 
                  className={cn(
                    "nav-item flex flex-col items-center pt-2 pb-1 w-full",
                    isActive && "text-primary border-t-2 border-primary"
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
