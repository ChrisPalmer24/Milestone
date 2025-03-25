import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Star, Check, RefreshCcw, Info } from 'lucide-react';
import { checkPwaInstallable, showInstallPrompt } from '@/lib/service-worker';
import { isNativePlatform } from '@/capacitor';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Component that provides a button to install the application as a PWA
 */
export default function InstallPWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [installStatus, setInstallStatus] = useState<'not-checked' | 'checking' | 'available' | 'not-available' | 'installed'>('not-checked');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  
  useEffect(() => {
    // Only check if PWA is installable in browser environments (not in native mobile)
    if (!isNativePlatform()) {
      const checkStatus = async () => {
        setInstallStatus('checking');
        
        // Check service worker status
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
              setServiceWorkerStatus('active');
            } else {
              setServiceWorkerStatus('inactive');
            }
          } catch (error) {
            console.error('Error checking service worker status:', error);
            setServiceWorkerStatus('inactive');
          }
        } else {
          setServiceWorkerStatus('inactive');
        }
        
        // Check if app is installable
        try {
          const canInstall = await checkPwaInstallable();
          setIsInstallable(canInstall);
          setInstallStatus(canInstall ? 'available' : 
            window.matchMedia('(display-mode: standalone)').matches ? 'installed' : 'not-available');
        } catch (error) {
          console.error('Error checking PWA installable status:', error);
          setInstallStatus('not-available');
        }
      };
      
      checkStatus();
      
      // Also check when the window is focused, as installation status might have changed
      const handleFocus = () => checkStatus();
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);
  
  // Only render the install card if the app is installable
  if (installStatus === 'not-available' || installStatus === 'installed' || installStatus === 'not-checked') {
    return null;
  }
  
  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Install Milestone App</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant={serviceWorkerStatus === 'active' ? 'default' : 'outline'} className="ml-2">
                    {serviceWorkerStatus === 'active' ? (
                      <span className="flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        PWA Ready
                      </span>
                    ) : serviceWorkerStatus === 'checking' ? (
                      <span className="flex items-center">
                        <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
                        Checking
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        Limited
                      </span>
                    )}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {serviceWorkerStatus === 'active' 
                  ? 'Service worker is active. App is ready for offline use.'
                  : 'Service worker setup is pending. Some offline features may be limited.'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Install on your device for easier access and offline usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Works offline to track your investments</span>
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
              try {
                const installed = await showInstallPrompt();
                if (installed) {
                  setInstallStatus('installed');
                  setIsInstallable(false);
                }
              } catch (error) {
                console.error('Error during installation:', error);
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Install Milestone
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}