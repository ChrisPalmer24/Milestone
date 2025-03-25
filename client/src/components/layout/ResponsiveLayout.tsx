import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { usePortfolio } from '@/context/PortfolioContext';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

/**
 * Simplified responsive layout that renders directly to avoid nesting issues
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
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