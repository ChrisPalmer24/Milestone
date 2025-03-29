import { ReactNode } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { usePortfolio } from "@/context/PortfolioContext";

// Note: Header is no longer imported here as it's moved to ResponsiveLayout

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const { activeSection, setActiveSection } = usePortfolio();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header component removed from here to prevent duplicate headers */}
      
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {children}
      </main>
      
      <BottomNav 
        activeSection={activeSection}
        onChange={setActiveSection}
      />
    </div>
  );
}