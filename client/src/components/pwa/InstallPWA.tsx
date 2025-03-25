import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Star } from 'lucide-react';
import { checkPwaInstallable, showInstallPrompt } from '@/lib/service-worker';
import { isNativePlatform } from '@/capacitor';

/**
 * Component that provides a button to install the application as a PWA
 */
export default function InstallPWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  
  useEffect(() => {
    // Only check if PWA is installable in browser environments (not in native mobile)
    if (!isNativePlatform()) {
      const checkInstallable = async () => {
        const canInstall = await checkPwaInstallable();
        setIsInstallable(canInstall);
      };
      
      checkInstallable();
    }
  }, []);
  
  // Only render the component if the app is installable
  if (!isInstallable) {
    return null;
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Install Milestone</CardTitle>
        <CardDescription>
          Install the app on your device for easier access and offline usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Quick access from home screen</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Faster loading experience</span>
          </div>
          
          <Button 
            className="w-full"
            onClick={async () => {
              const installed = await showInstallPrompt();
              if (installed) {
                setIsInstallable(false);
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}