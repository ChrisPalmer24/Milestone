import { ReactNode } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { usePortfolio } from "@/context/PortfolioContext";

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const { activeSection, setActiveSection } = usePortfolio();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      
      <BottomNav 
        activeSection={activeSection}
        onChange={setActiveSection}
      />
    </div>
  );
}