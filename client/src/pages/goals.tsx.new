import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AISuggestedMilestones from "@/components/milestones/AISuggestedMilestones";
// Removed MilestoneAnimationManager import

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Target, Plus, Sparkles } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { usePortfolio } from "@/context/PortfolioContext";
import { useToast } from "@/hooks/use-toast";

// Form schema for adding a new milestone
const milestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  accountType: z.string(),
  targetValue: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Target value must be a positive number" }
  ),
});

export default function Goals() {
  const { 
    accounts, 
    milestones,
    totalPortfolioValue,
    addMilestone,
    deleteMilestone,
    isLoading 
  } = usePortfolio();
  const { toast } = useToast();
  
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<number | null>(null);
  
  // Calculate the values for each account type to track progress
  const [accountValues, setAccountValues] = useState({
    total: 0,
    ISA: 0,
    SIPP: 0,
    LISA: 0,
    GIA: 0
  });
  
  // Update account values when accounts change
  useEffect(() => {
    const newValues = {
      total: totalPortfolioValue,
      ISA: 0,
      SIPP: 0,
      LISA: 0,
      GIA: 0
    };
    
    accounts.forEach(account => {
      if (account.accountType in newValues) {
        newValues[account.accountType as keyof typeof newValues] += account.currentValue;
      }
    });
    
    setAccountValues(newValues);
  }, [accounts, totalPortfolioValue]);
  
  // Form for adding a new milestone
  const form = useForm<z.infer<typeof milestoneSchema>>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      name: "",
      accountType: "ALL",
      targetValue: "",
    },
  });
  
  // Handle form submission for adding a milestone
  const onSubmit = async (values: z.infer<typeof milestoneSchema>) => {
    try {
      await addMilestone({
        name: values.name,
        accountType: values.accountType as any,
        targetValue: values.targetValue
      });
      setIsAddMilestoneOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding milestone:", error);
    }
  };
  
  // Helper function to get the appropriate color for progress bars
  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-rose-500";
  };
  
  // Helper function to get the current value for a milestone's account type
  const getCurrentValueForMilestone = (milestone: any) => {
    if (!milestone.accountType) return accountValues.total;
    return accountValues[milestone.accountType as keyof typeof accountValues] || 0;
  };
  
  return (
    <div className="goals-screen max-w-5xl mx-auto px-4 pb-20 mt-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Milestones</CardTitle>
              <CardDescription>Track your investment goals and celebrate your progress</CardDescription>
            </div>
            
            {/* Add Milestone Dialog */}
            <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="mr-2 h-4 w-4" /> Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Investment Milestone</DialogTitle>
                  <DialogDescription>
                    Set a target value to reach in your investment journey.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Milestone Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., First £10k, Emergency Fund" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ALL">All Accounts (Total Portfolio)</SelectItem>
                              <SelectItem value="ISA">ISA Only</SelectItem>
                              <SelectItem value="SIPP">SIPP Only</SelectItem>
                              <SelectItem value="LISA">Lifetime ISA Only</SelectItem>
                              <SelectItem value="GIA">General Account Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Value (£)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Add Milestone</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Delete Milestone Alert Dialog */}
            <AlertDialog open={!!milestoneToDelete} onOpenChange={(open) => !open && setMilestoneToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this milestone?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={async () => {
                      if (milestoneToDelete) {
                        await deleteMilestone(milestoneToDelete);
                        setMilestoneToDelete(null);
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center p-6">
              <p className="text-gray-500">Loading milestones...</p>
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center p-8">
              <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones set yet</h3>
              <p className="text-gray-500 mb-6">
                Set financial milestones to track your investment progress and celebrate your achievements.
              </p>
              <Button 
                onClick={() => setIsAddMilestoneOpen(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="mr-2 h-4 w-4" /> Create First Milestone
              </Button>
            </div>
          ) : (
            milestones.map(milestone => {
              const currentValue = getCurrentValueForMilestone(milestone);
              const targetValue = Number(milestone.targetValue);
              const progress = Math.min((currentValue / targetValue) * 100, 100);
              const progressBarColor = getProgressBarColor(progress);
              const isComplete = progress >= 100;
              
              // Format the progress display
              const progressDisplay = isComplete 
                ? "Completed!" 
                : `£${currentValue.toLocaleString()} of £${targetValue.toLocaleString()}`;
              
              return (
                <div key={milestone.id} className="border-b border-gray-200 py-4 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-lg">{milestone.name}</h3>
                        {isComplete && (
                          <div className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Achieved
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {milestone.accountType === "ALL" ? "All Accounts" :
                         milestone.accountType === "ISA" ? "ISA Only" :
                         milestone.accountType === "SIPP" ? "SIPP Only" :
                         milestone.accountType === "LISA" ? "Lifetime ISA Only" :
                         milestone.accountType === "GIA" ? "General Account Only" :
                         "All Accounts"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-right font-bold mr-3">
                        £{Number(milestone.targetValue).toLocaleString()}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                        onClick={() => setMilestoneToDelete(milestone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="progress-bar mt-2">
                    <div
                      className={`progress-bar-fill ${progressBarColor}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-right text-xs text-gray-500 mt-1">
                    {progress < 100 ? 
                      progressDisplay : 
                      `${Math.round(progress)}% complete`}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      
      {/* AI Suggested Milestones section */}
      <AISuggestedMilestones />
      
      {/* Removed the MilestoneAnimationManager component that was causing issues */}
    </div>
  );
}