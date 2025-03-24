import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Moon, 
  Download, 
  LifeBuoy, 
  FileJson, 
  FileSpreadsheet,
  DatabaseBackup
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const { toast } = useToast();
  
  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [currency, setCurrency] = useState("GBP");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  
  const handleSaveSettings = () => {
    // In a real app, we would save these settings to an API
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };
  
  const handleDataExport = (format: string) => {
    // In a real app, we would generate and download the file
    toast({
      title: "Export started",
      description: `Your data is being exported in ${format} format. This might take a moment.`,
    });
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Your data has been exported successfully.",
      });
    }, 1500);
  };
  
  return (
    <div className="settings-page max-w-4xl mx-auto px-4 pb-20 pt-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-gray-500">Switch between dark and light theme</p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode} 
                onCheckedChange={setDarkMode}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <Label>Display Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label>Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <p className="text-sm text-gray-500">Receive updates and alerts via email</p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  <Label htmlFor="app-notifications">App Notifications</Label>
                </div>
                <p className="text-sm text-gray-500">Receive in-app notifications and alerts</p>
              </div>
              <Switch 
                id="app-notifications" 
                checked={appNotifications} 
                onCheckedChange={setAppNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <DatabaseBackup className="h-4 w-4 mr-2" />
                  <Label htmlFor="auto-updates">Automatic API Updates</Label>
                </div>
                <p className="text-sm text-gray-500">Automatically update connected accounts</p>
              </div>
              <Switch 
                id="auto-updates" 
                checked={autoUpdates} 
                onCheckedChange={setAutoUpdates}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Data & Privacy Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-3">Export Your Data</h3>
              <p className="text-sm text-gray-500 mb-4">
                Download a copy of your investment data in various formats
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleDataExport("CSV")}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleDataExport("JSON")}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleDataExport("Excel")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel Export
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-md font-medium mb-2">Privacy & Terms</h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-primary p-0"
                >
                  Privacy Policy
                </Button>
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-primary p-0"
                >
                  Terms of Service
                </Button>
                <Button 
                  variant="link" 
                  size="sm"
                  className="text-primary p-0"
                >
                  Cookie Policy
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Button 
                variant="link" 
                className="text-red-500 p-0 flex items-center"
              >
                Delete All My Data
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Help & Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Help & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <LifeBuoy className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <p className="text-sm text-gray-500">
              Need help with Milestone? Our support team is available Monday-Friday, 9am-5pm GMT.
            </p>
          </CardContent>
        </Card>
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            className="w-full sm:w-auto"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}