import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { usePortfolio } from "@/context/PortfolioContext";
import Portfolio from "@/pages/portfolio";
import Goals from "@/pages/goals";
import Track from "@/pages/track";
import Fire from "@/pages/fire";

export default function Home() {
  const { activeSection, setActiveSection } = usePortfolio();

  // Render the active section
  const renderSection = () => {
    switch (activeSection) {
      case "portfolio":
        return <Portfolio />;
      case "goals":
        return <Goals />;
      case "track":
        return <Track />;
      case "fire":
        return <Fire />;
      default:
        return <Portfolio />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">{renderSection()}</main>

      <BottomNav activeSection={activeSection} onChange={setActiveSection} />
    </div>
  );
}
