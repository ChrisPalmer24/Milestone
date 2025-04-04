import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserRound, Mail, Lock, Calendar, Award, Target, Upload, Camera } from "lucide-react";

export default function Profile() {
  // Demo user data
  const [user] = useState({
    username: "demo",
    email: "demo@example.com",
    joinDate: "Jan 2023",
    investmentExperience: "Intermediate",
    accountsCount: 3,
    milestonesAchieved: 2
  });
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [name, setName] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Load saved profile image from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);
  
  // Handle profile image change
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we would make an API call here with the profile image
    // const formData = new FormData();
    // formData.append('username', name);
    // formData.append('email', email);
    // if (profileImage) {
    //   formData.append('profileImage', profileImage);
    // }
    
    // Save the profile image in local storage for demo purposes
    if (profileImage) {
      localStorage.setItem('profileImage', profileImage);
    }
    
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we would verify current password and update
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    
    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  return (
    <div className="profile-page max-w-4xl mx-auto px-4 pb-20 pt-6">
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Profile Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <Avatar className="w-24 h-24">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-primary/10">
                      <UserRound className="w-12 h-12 text-primary" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div 
                  className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={triggerImageUpload}
                >
                  <Camera className="w-8 h-8 text-white" />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*"
                  className="hidden" 
                />
              </div>
              
              <h2 className="text-xl font-semibold mt-4">{user.username}</h2>
              <p className="text-gray-500">{user.email}</p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-xs"
                onClick={triggerImageUpload}
              >
                <Upload className="w-3 h-3 mr-1" />
                Change Photo
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Member since</p>
                  <p className="font-medium">{user.joinDate}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Award className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{user.investmentExperience}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Stats</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline">{user.accountsCount} Accounts</Badge>
                    <Badge variant="outline">{user.milestonesAchieved} Milestones</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserRound className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input 
                    id="username" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full">Update Profile</Button>
            </form>
            
            <Separator className="my-6" />
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <h3 className="text-md font-medium">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full"
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}