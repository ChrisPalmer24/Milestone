import { useState, useEffect, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BrokerProviderAsset } from "shared/schema";
import { useBrokerProviders } from "@/hooks/use-broker-providers";
import { getProviderName } from "@/lib/broker";

interface ScreenshotUploadProps {
  brokerAssets: BrokerProviderAsset[];
  onExtractedValues: (data: { assetId: string; value: number }[]) => void;
}

export function ScreenshotUpload({
  brokerAssets,
  onExtractedValues,
}: ScreenshotUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: brokerProviders } = useBrokerProviders();

  // Handle file upload
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      if (!file.type.match("image.*")) {
        toast({
          title: "Invalid file type",
          description: "Please upload image files only (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result && typeof result === 'string') {
          newImages.push(result);
          setUploadedImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Remove an image from the list
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Process the uploaded images
  const processImages = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "No images to process",
        description: "Please upload at least one screenshot to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get all provider names for our active accounts
      const providerNames = brokerAssets.map(asset => 
        getProviderName(asset.providerId, brokerProviders ?? [])
      );

      // Process each image and get the results
      const results = await Promise.all(
        uploadedImages.map(async (imageData) => {
          try {
            const response = await fetch("/api/ocr/extract-values", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                imageData,
                providerNames: Array.from(new Set(providerNames)), // Remove duplicates
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.extractedValues;
          } catch (error) {
            console.error("Error processing image:", error);
            return [];
          }
        })
      );

      // Flatten the results and match with asset IDs
      const flatResults = results.flat();
      
      const matchedValues = flatResults
        .map(result => {
          // Find the asset that matches this provider name
          const matchingAsset = brokerAssets.find(asset => 
            getProviderName(asset.providerId, brokerProviders ?? []).toLowerCase() === 
            result.accountName.toLowerCase()
          );
          
          if (matchingAsset) {
            return {
              assetId: matchingAsset.id,
              value: result.amount,
              confidence: result.confidence,
              providerName: result.accountName
            };
          }
          return null;
        })
        .filter(Boolean) as { assetId: string; value: number; confidence: number; providerName: string }[];
      
      if (matchedValues.length === 0) {
        toast({
          title: "No account values detected",
          description: "We couldn't identify any account values in your screenshots. Please try again with clearer images.",
          variant: "destructive",
        });
      } else {
        // Filter out low confidence matches and pass to the parent component
        const highConfidenceMatches = matchedValues.filter(m => m.confidence > 0.7);
        
        if (highConfidenceMatches.length > 0) {
          onExtractedValues(highConfidenceMatches.map(({ assetId, value }) => ({ assetId, value })));
          
          toast({
            title: "Account values detected",
            description: `Found ${highConfidenceMatches.length} account values in your screenshots.`,
          });
          
          setIsDialogOpen(false);
          setUploadedImages([]);
        } else {
          toast({
            title: "Low confidence matches",
            description: "We found some possible matches but they have low confidence. Please verify the values or try with clearer screenshots.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error in image processing:", error);
      toast({
        title: "Processing error",
        description: "An error occurred while processing your screenshots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-white"
        onClick={() => setIsDialogOpen(true)}
      >
        <Camera size={16} />
        <span>Upload Screenshots</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Account Screenshots</DialogTitle>
            <DialogDescription>
              Take screenshots of your account balances and upload them here to automatically fill in the values. This feature is still in beta and is experimental*
            </DialogDescription>
          </DialogHeader>

          <div
            className={`
              mt-4 p-6 border-2 border-dashed rounded-md transition-colors
              ${dragActive ? "border-primary bg-primary/5" : "border-gray-300"}
            `}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload size={32} className="text-gray-400" />
              <p className="text-sm text-center text-gray-600">
                Drag and drop your screenshots here, or click to browse
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleUploadClick}
                disabled={isProcessing}
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <p className="text-xs italic text-gray-500 mt-2">
            *We do not store screenshots for security reasons - they are simply read by the AI using OCR to get the figures to make the input process easier for you
          </p>

          {uploadedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full rounded-md border border-gray-200 h-32 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => removeImage(index)}
                    disabled={isProcessing}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setUploadedImages([]);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={processImages}
              disabled={uploadedImages.length === 0 || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                "Extract Account Values"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}