import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, Trophy, ArrowBigUp, Sparkles, Star, PartyPopper } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Animation types for variety
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
  type = "celebration" 
}: MilestoneAnimationProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Trigger confetti when animation is shown
  useEffect(() => {
    if (isVisible) {
      // Create a longer celebratory confetti effect
      const duration = 3000;
      const end = Date.now() + duration;
      
      // Different effects based on animation type
      if (type === "confetti") {
        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }
          
          confetti({
            particleCount: 30,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 250);
        
        return () => clearInterval(interval);
      } else if (type === "celebration") {
        // School colors
        const colors = ['#26a69a', '#ffd54f', '#42a5f5', '#ef5350'];
        
        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }
          
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0.25, y: 0.6 },
            colors: colors
          });
          
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 0.75, y: 0.6 },
            colors: colors
          });
        }, 300);
        
        return () => clearInterval(interval);
      } else if (type === "stars") {
        // Gold star shower
        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }
          
          confetti({
            particleCount: 20,
            spread: 90,
            shapes: ['star'],
            colors: ['#FFD700', '#FFC107'],
            scalar: 1.2
          });
        }, 400);
        
        return () => clearInterval(interval);
      }
    }
  }, [isVisible, type]);
  
  // Automatically hide the animation after a delay
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
        setTimeout(() => onClose(), 500); // Allow exit animation to play
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  
  // Different animation content based on type
  const getAnimationContent = () => {
    switch(type) {
      case "trophy":
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, type: "spring" }}
              className="inline-block mb-4"
            >
              <Trophy className="w-20 h-20 text-yellow-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
          </div>
        );
        
      case "growth":
        return (
          <div className="text-center">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-4"
            >
              <ArrowBigUp className="w-16 h-16 text-green-500" />
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-8 h-8 bg-green-500 rounded-full absolute -top-2 -right-2 flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Growth Target Reached!</h2>
          </div>
        );
        
      case "stars":
        return (
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <motion.div className="absolute top-0 left-0" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                <Star className="w-8 h-8 text-amber-300 absolute -top-4 -left-8" />
                <Star className="w-6 h-6 text-amber-400 absolute top-2 -left-12" />
                <Star className="w-5 h-5 text-amber-500 absolute top-8 -left-6" />
              </motion.div>
              <motion.div className="absolute top-0 right-0" animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
                <Star className="w-7 h-7 text-amber-300 absolute -top-8 -right-4" />
                <Star className="w-5 h-5 text-amber-400 absolute -top-2 -right-10" />
                <Star className="w-4 h-4 text-amber-500 absolute top-6 -right-8" />
              </motion.div>
              <Sparkles className="w-20 h-20 text-amber-400 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Outstanding Achievement!</h2>
          </div>
        );
        
      case "celebration":
      default:
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-block mb-4"
            >
              <PartyPopper className="w-16 h-16 text-primary" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold mb-2"
            >
              Milestone Achieved!
            </motion.h2>
          </div>
        );
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            {getAnimationContent()}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4 text-center"
            >
              <p className="text-xl font-semibold text-primary">{milestone.name}</p>
              <p className="text-gray-600">
                {milestone.accountType ? 
                  `You've reached your target of £${Number(milestone.targetValue).toLocaleString()} in your ${milestone.accountType} account!` : 
                  `You've reached your target of £${Number(milestone.targetValue).toLocaleString()} across your portfolio!`
                }
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <Button 
                onClick={onClose} 
                className="bg-primary text-white hover:bg-primary/90"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Component that manages showing milestone animations as they are completed
export function MilestoneAnimationManager({ 
  milestones, 
  currentValues, 
  onMilestoneComplete 
}: { 
  milestones: any[], 
  currentValues: {[key: string]: number},
  onMilestoneComplete?: (milestone: any) => void
}) {
  const [completedMilestone, setCompletedMilestone] = useState<any | null>(null);
  const [animationType, setAnimationType] = useState<AnimationType>("celebration");
  
  // Check for newly completed milestones
  useEffect(() => {
    if (!milestones || milestones.length === 0) return;
    
    // Find milestones that have just been completed
    const justCompleted = milestones.find(milestone => {
      // Skip already marked complete
      if (milestone.isCompleted) return false;
      
      const targetValue = Number(milestone.targetValue);
      let currentValue = 0;
      
      if (milestone.accountType) {
        currentValue = currentValues[milestone.accountType] || 0;
      } else {
        currentValue = currentValues['total'] || 0;
      }
      
      return currentValue >= targetValue;
    });
    
    if (justCompleted && !completedMilestone) {
      // Randomly select an animation type for variety
      const animationTypes: AnimationType[] = ["confetti", "trophy", "growth", "stars", "celebration"];
      const randomType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
      
      setAnimationType(randomType);
      setCompletedMilestone(justCompleted);
      
      // Notify parent component (optional)
      if (onMilestoneComplete) {
        onMilestoneComplete(justCompleted);
      }
    }
  }, [milestones, currentValues, completedMilestone, onMilestoneComplete]);
  
  return (
    <MilestoneAnimation
      milestone={completedMilestone || {id: 0, name: "", targetValue: "0", accountType: null}}
      isVisible={!!completedMilestone}
      onClose={() => setCompletedMilestone(null)}
      type={animationType}
    />
  );
}