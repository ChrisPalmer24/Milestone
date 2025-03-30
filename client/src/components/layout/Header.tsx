import { User, Settings, Link as LinkIcon, Moon, Sun } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-background shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-foreground">Milestone</h1>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted">
              <User className="w-6 h-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/api-connections" className="cursor-pointer">
                  <LinkIcon className="w-4 h-4 mr-2" /> API Connections
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4 mr-2" /> Dark mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 mr-2" /> Light mode
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
