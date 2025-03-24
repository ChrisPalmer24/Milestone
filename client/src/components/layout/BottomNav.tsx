import { 
  TrendingUp, 
  Flag, 
  PlusCircle, 
  LineChart, 
  Flame 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { 
    id: "portfolio", 
    label: "Portfolio", 
    icon: <TrendingUp className="w-6 h-6" /> 
  },
  { 
    id: "goals", 
    label: "Goals", 
    icon: <Flag className="w-6 h-6" /> 
  },
  { 
    id: "record", 
    label: "Record", 
    icon: <PlusCircle className="w-6 h-6" /> 
  },
  { 
    id: "track", 
    label: "Track", 
    icon: <LineChart className="w-6 h-6" /> 
  },
  { 
    id: "fire", 
    label: "FIRE", 
    icon: <Flame className="w-6 h-6" /> 
  },
];

type BottomNavProps = {
  activeSection: string;
  onChange: (section: string) => void;
};

export default function BottomNav({ activeSection, onChange }: BottomNavProps) {
  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-10">
      <div className="max-w-5xl mx-auto">
        <ul className="flex justify-between">
          {navItems.map((item) => (
            <li key={item.id} className="flex-1">
              <button 
                className={cn(
                  "nav-item flex flex-col items-center pt-2 pb-1 w-full",
                  activeSection === item.id && "text-primary border-t-2 border-primary"
                )}
                onClick={() => onChange(item.id)}
                aria-label={item.label}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
