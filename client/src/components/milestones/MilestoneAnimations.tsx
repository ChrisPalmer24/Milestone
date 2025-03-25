import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trophy, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

type AnimationType = "confetti" | "trophy" | "growth" | "stars" | "celebration";

interface MilestoneAnimationProps {
  milestone: {
    id: number;
    name: string;
    targetValue: string;
    accountType: string | null;
  };
  isVisible: boolean;
  onClose: () => void;
  type?: AnimationType;
}

export function MilestoneAnimation({ 
  milestone, 
  isVisible, 
  onClose,
  type = "confetti" 
}: MilestoneAnimationProps) {
  
  useEffect(() => {
    // If animation is shown, trigger the confetti
    if (isVisible && type === "confetti") {
      // Configure the confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      // Function to create confetti bursts
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      // Create realistic confetti effect
      const createConfettiBurst = () => {
        const timeLeft = animationEnd - Date.now();
        
        // Stop the animation when time is up
        if (timeLeft <= 0) return;
        
        // Configure and launch confetti
        confetti({
          particleCount: 3,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.4) },
          colors: ['#FFD700', '#FFA500', '#00BFFF', '#32CD32'],
          shapes: ['circle', 'square', 'star'],
          gravity: 0.8,
          decay: 0.95,
          ticks: 200
        });
        
        // Continue the animation
        if (timeLeft > 0) {
          requestAnimationFrame(createConfettiBurst);
        }
      };
      
      // Start the confetti animation
      createConfettiBurst();
      
      // Create a big burst at the beginning
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [isVisible, type]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm overflow-hidden">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 300 
            }}
            className="max-w-md w-full mx-4"
          >
            <Card className="border-4 border-primary overflow-hidden">
              <div className="absolute top-2 right-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose} 
                  className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <motion.div 
                className="bg-gradient-to-br from-primary/80 to-primary p-6 text-center text-white"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="mx-auto mb-3 bg-white/20 w-20 h-20 rounded-full flex items-center justify-center"
                >
                  {type === "trophy" ? (
                    <Trophy className="h-10 w-10 text-yellow-200" />
                  ) : (
                    <TrendingUp className="h-10 w-10 text-white" />
                  )}
                </motion.div>
                
                <motion.h2 
                  className="text-2xl font-bold mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Milestone Achieved!
                </motion.h2>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <h3 className="text-xl font-semibold mb-1">{milestone.name}</h3>
                  {milestone.accountType && (
                    <p className="text-sm opacity-80 mb-1">
                      {milestone.accountType === "ISA" ? "ISA Account" :
                       milestone.accountType === "LISA" ? "Lifetime ISA" :
                       milestone.accountType === "SIPP" ? "Pension (SIPP)" :
                       milestone.accountType === "GIA" ? "General Account" :
                       milestone.accountType}
                    </p>
                  )}
                  <p className="text-xl font-bold">
                    £{Number(milestone.targetValue).toLocaleString()}
                  </p>
                </motion.div>
              </motion.div>
              
              <CardContent className="p-6 text-center">
                <motion.p 
                  className="text-gray-700 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  Congratulations! You've hit an important milestone in your financial journey. 
                  Keep up the great work!
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Button
                    onClick={onClose}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface MilestoneAnimationManagerProps {
  milestones: Array<{
    id: number;
    name: string;
    targetValue: string;
    accountType: string | null;
    isCompleted: boolean;
  }>;
  currentValues: {
    total: number;
    ISA: number;
    SIPP: number;
    LISA: number;
    GIA: number;
  };
  onMilestoneComplete: (milestone: any) => Promise<void>;
}

export function MilestoneAnimationManager({ 
  milestones,
  currentValues,
  onMilestoneComplete
}: MilestoneAnimationManagerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [completedMilestones, setCompletedMilestones] = useState<Array<any>>([]);

  // Find milestones that have just been achieved
  useEffect(() => {
    const newlyCompleted = milestones.filter(milestone => {
      // Don't show if already marked as completed
      if (milestone.isCompleted) {
        return false;
      }
      
      // Check if the milestone is now achieved
      const targetValue = Number(milestone.targetValue);
      const currentValue = milestone.accountType ? 
        currentValues[milestone.accountType as keyof typeof currentValues] : 
        currentValues.total;
        
      return currentValue >= targetValue;
    });
    
    if (newlyCompleted.length > 0) {
      setCompletedMilestones(newlyCompleted);
      setShowAnimation(true);
      
      // Mark these milestones as completed in the backend
      newlyCompleted.forEach(milestone => {
        onMilestoneComplete(milestone);
      });
    }
  }, [milestones, currentValues, onMilestoneComplete]);
  
  const handleClose = () => {
    setShowAnimation(false);
    
    // Check if there are more milestones to show
    if (currentIndex < completedMilestones.length - 1) {
      // Wait a bit before showing the next animation
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setShowAnimation(true);
      }, 500);
    } else {
      // Reset to the beginning for the next batch of milestones
      setCurrentIndex(0);
      setCompletedMilestones([]);
    }
  };
  
  // If no milestones or no current milestone, don't render
  if (completedMilestones.length === 0 || !completedMilestones[currentIndex]) {
    return null;
  }
  
  return (
    <MilestoneAnimation
      milestone={completedMilestones[currentIndex]}
      isVisible={showAnimation}
      onClose={handleClose}
      type={currentIndex % 2 === 0 ? "confetti" : "trophy"}
    />
  );
}