import { ReactNode } from 'react';
import MainLayout from './MainLayout';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

/**
 * Responsive layout that handles different layouts for mobile and desktop
 * - Uses desktop layout with sidebar as default for now
 * - Note: Mobile-specific functionality temporarily disabled
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  // We're simplifying this component while fixing the hook issues
  // This ensures the application loads properly
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}