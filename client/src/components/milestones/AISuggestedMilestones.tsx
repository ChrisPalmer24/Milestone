import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, PlusCircle } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { generateMilestoneSuggestions, SuggestedMilestone } from "@/lib/utils/milestones";

// Define AccountType directly here as well to avoid type issues
type AccountType = "ISA" | "SIPP" | "LISA" | "GIA";

export default function AISuggestedMilestones() {
  const { 
    accounts, 
    milestones, 
    totalPortfolioValue, 
    addMilestone, 
    isLoading 
  } = usePortfolio();
  
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedMilestone[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Generate new suggestions
  const handleGenerateSuggestions = () => {
    setGeneratingSuggestions(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const newSuggestions = generateMilestoneSuggestions(
        accounts,
        totalPortfolioValue,
        milestones
      );
      
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      setGeneratingSuggestions(false);
    }, 1000);
  };
  
  // Add a suggested milestone to actual milestones
  const handleAddSuggestion = async (suggestion: SuggestedMilestone) => {
    try {
      // Use type assertion to ensure the type matches what addMilestone expects
      const accountType = suggestion.accountType as AccountType | null;
      
      await addMilestone({
        name: suggestion.name,
        accountType: accountType,
        targetValue: suggestion.targetValue
      });
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => 
        s.name !== suggestion.name || 
        s.targetValue !== suggestion.targetValue || 
        s.accountType !== suggestion.accountType
      ));
    } catch (error) {
      console.error("Error adding suggested milestone:", error);
    }
  };
  
  // Get color based on account type
  const getAccountTypeColor = (type: string | null) => {
    switch (type) {
      case "ISA":
        return "text-blue-400 bg-blue-50";
      case "SIPP":
        return "text-secondary bg-green-50";
      case "LISA":
        return "text-accent bg-amber-50";
      case "GIA":
        return "text-purple-500 bg-purple-50";
      default:
        return "text-primary bg-blue-50";
    }
  };
  
  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold">AI Suggested Milestones</h2>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center text-primary border-primary hover:bg-primary hover:text-white"
            onClick={handleGenerateSuggestions}
            disabled={generatingSuggestions || isLoading}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {showSuggestions ? "Refresh Suggestions" : "Generate Suggestions"}
          </Button>
        </div>
        
        {isLoading || generatingSuggestions ? (
          // Skeleton loading state
          <div className="space-y-3 mt-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : !showSuggestions ? (
          // Prompt to generate suggestions
          <div className="py-6 text-center">
            <p className="text-gray-500 mb-2">
              Use AI to generate smart milestone suggestions based on your portfolio
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Our system analyzes your investments and creates personalized goals
            </p>
            <Button 
              onClick={handleGenerateSuggestions}
              className="bg-primary text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Milestone Suggestions
            </Button>
          </div>
        ) : suggestions.length === 0 ? (
          // No suggestions case
          <div className="py-6 text-center">
            <p className="text-gray-500">
              No new milestone suggestions at the moment.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try adding more accounts or check back later
            </p>
          </div>
        ) : (
          // Show suggestions
          <div className="space-y-3 mt-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-medium mr-2">
                      {suggestion.name} 
                    </span>
                    {suggestion.icon && (
                      <span className="text-lg">{suggestion.icon}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1.5">{suggestion.description}</p>
                  <div className="flex items-center">
                    <span className={`text-xs font-medium mr-2 px-2 py-0.5 rounded-full ${getAccountTypeColor(suggestion.accountType)}`}>
                      {suggestion.accountType || "Portfolio"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Target: £{Number(suggestion.targetValue).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => handleAddSuggestion(suggestion)}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}