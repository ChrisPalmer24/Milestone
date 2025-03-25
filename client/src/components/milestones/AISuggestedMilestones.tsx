import { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SuggestedMilestone {
  name: string;
  accountType: string | null;
  targetValue: string;
  description: string;
  icon?: string;
}

export default function AISuggestedMilestones() {
  const { accounts, totalPortfolioValue, addMilestone } = usePortfolio();
  const { toast } = useToast();
  
  const [suggestions, setSuggestions] = useState<SuggestedMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    // Only fetch suggestions when we have accounts to analyze
    if (accounts.length > 0) {
      fetchSuggestions();
    }
  }, [accounts.length, refreshKey]);
  
  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/milestones/suggestions/ai");
      
      if (!response.ok) {
        if (response.status === 403) {
          // API key not configured
          setError("AI suggestions require an API key configuration");
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to fetch AI milestone suggestions:", err);
      setError("Failed to generate suggestions");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddSuggestion = async (suggestion: SuggestedMilestone) => {
    try {
      await addMilestone({
        name: suggestion.name,
        accountType: suggestion.accountType as any,
        targetValue: suggestion.targetValue
      });
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
      
      toast({
        title: "Milestone added",
        description: "The suggested milestone has been added to your goals.",
      });
    } catch (error) {
      console.error("Error adding suggested milestone:", error);
      toast({
        title: "Failed to add milestone",
        description: "There was an error adding this milestone.",
        variant: "destructive",
      });
    }
  };
  
  // Don't show this section if there are no accounts yet
  if (accounts.length === 0) {
    return null;
  }
  
  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Sparkles className="text-primary w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">AI-Suggested Milestones</h2>
          </div>
          
          {!isLoading && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="text-sm text-gray-600"
            >
              Refresh
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="ml-3 text-gray-600">Generating smart milestone suggestions...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-gray-500 mb-2">{error}</p>
            <p className="text-sm text-gray-400">
              {error.includes("API key") ? 
                "Ask your administrator to configure the xAI API key to enable AI suggestions." : 
                "Please try again later."}
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-gray-500">No AI suggestions available right now.</p>
            <p className="text-sm text-gray-400 mt-1">Try adding more accounts or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <h3 className="font-medium">{suggestion.name}</h3>
                  {suggestion.icon && (
                    <span className="text-xl">{suggestion.icon}</span>
                  )}
                </div>
                
                {suggestion.accountType && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    suggestion.accountType === "ISA" ? "text-blue-400 bg-blue-50" :
                    suggestion.accountType === "SIPP" ? "text-secondary bg-green-50" :
                    suggestion.accountType === "LISA" ? "text-accent bg-amber-50" :
                    suggestion.accountType === "GIA" ? "text-purple-500 bg-purple-50" :
                    "text-primary bg-blue-50"
                  } inline-block mb-2 mt-1`}>
                    {suggestion.accountType}
                  </span>
                )}
                
                <p className="text-gray-600 text-sm mb-3">
                  {suggestion.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-primary font-medium">
                    £{Number(suggestion.targetValue).toLocaleString()}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-primary border-primary hover:bg-primary/10"
                    onClick={() => handleAddSuggestion(suggestion)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}