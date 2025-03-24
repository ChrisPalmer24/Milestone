import { useState } from "react";
import { 
  Card, 
  CardContent 
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { usePortfolio } from "@/context/PortfolioContext";
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

// Form schema for adding a new milestone
const milestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountType: z.string().optional(),
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
  
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<number | null>(null);
  
  // Form for adding a new milestone
  const form = useForm<z.infer<typeof milestoneSchema>>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      name: "",
      accountType: undefined,
      targetValue: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof milestoneSchema>) => {
    try {
      await addMilestone({
        name: values.name,
        accountType: values.accountType as any || null,
        targetValue: Number(values.targetValue)
      });
      setIsAddMilestoneOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding milestone:", error);
    }
  };
  
  // Handle milestone deletion
  const handleDeleteMilestone = async () => {
    if (milestoneToDelete !== null) {
      try {
        await deleteMilestone(milestoneToDelete);
        setMilestoneToDelete(null);
      } catch (error) {
        console.error("Error deleting milestone:", error);
      }
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
  
  // Get progress percentage for a milestone
  const calculateProgress = (milestone: any) => {
    let currentValue = 0;
    
    if (milestone.accountType) {
      // Sum values of accounts with matching type
      currentValue = accounts.reduce((sum, account) => 
        account.accountType === milestone.accountType ? sum + Number(account.currentValue) : sum, 
        0
      );
    } else {
      // Use total portfolio value for general milestones
      currentValue = totalPortfolioValue;
    }
    
    const targetValue = Number(milestone.targetValue);
    const percentage = (currentValue / targetValue) * 100;
    
    // Cap at 100%
    return Math.min(percentage, 100);
  };
  
  // Format display for progress
  const formatProgressDisplay = (milestone: any) => {
    let currentValue = 0;
    
    if (milestone.accountType) {
      // Sum values of accounts with matching type
      currentValue = accounts.reduce((sum, account) => 
        account.accountType === milestone.accountType ? sum + Number(account.currentValue) : sum, 
        0
      );
    } else {
      // Use total portfolio value for general milestones
      currentValue = totalPortfolioValue;
    }
    
    const targetValue = Number(milestone.targetValue);
    const percentage = (currentValue / targetValue) * 100;
    
    // Format the display based on progress
    if (percentage >= 100) {
      return "Completed!";
    } else {
      const remaining = targetValue - currentValue;
      return `£${remaining.toLocaleString()} more needed`;
    }
  };

  return (
    <div className="goals-screen max-w-5xl mx-auto px-4 pb-20">
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">Milestones</h2>
            
            <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary">
                  <Plus className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Milestone</DialogTitle>
                  <DialogDescription>
                    Create a new milestone to track your investment progress.
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
                            <Input placeholder="e.g. First £100k" {...field} />
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
                          <FormLabel>Account Type (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="All accounts (portfolio)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">All accounts (portfolio)</SelectItem>
                              <SelectItem value="ISA">ISA</SelectItem>
                              <SelectItem value="SIPP">SIPP</SelectItem>
                              <SelectItem value="LISA">LISA</SelectItem>
                              <SelectItem value="GIA">GIA</SelectItem>
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
          </div>

          {isLoading ? (
            // Skeleton loading state for milestones
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full mt-2" />
                <div className="flex justify-end mt-1">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          ) : milestones.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 mb-4">No milestones added yet.</p>
              <Button 
                onClick={() => setIsAddMilestoneOpen(true)}
                className="bg-primary text-white"
              >
                Add Your First Milestone
              </Button>
            </div>
          ) : (
            // List of milestones
            milestones.map((milestone) => {
              const progress = calculateProgress(milestone);
              const progressDisplay = formatProgressDisplay(milestone);
              const progressBarColor = progress === 100 ? "bg-secondary" : 
                milestone.accountType ? getAccountTypeColor(milestone.accountType).split(' ')[0] : "bg-primary";
              
              return (
                <div key={milestone.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{milestone.name}</h3>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium mr-2 px-2 py-0.5 rounded-full ${getAccountTypeColor(milestone.accountType)}`}>
                          {milestone.accountType || "Portfolio"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {milestone.accountType ? 
                            `£${accounts.reduce((sum, account) => 
                              account.accountType === milestone.accountType ? sum + Number(account.currentValue) : sum, 
                              0
                            ).toLocaleString()} of £${Number(milestone.targetValue).toLocaleString()}` :
                            `£${totalPortfolioValue.toLocaleString()} of £${Number(milestone.targetValue).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <AlertDialog open={milestoneToDelete === milestone.id} onOpenChange={(open) => !open && setMilestoneToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => setMilestoneToDelete(milestone.id)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this milestone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setMilestoneToDelete(null)}>
                            No, cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteMilestone}>
                            Yes, delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
    </div>
  );
}
