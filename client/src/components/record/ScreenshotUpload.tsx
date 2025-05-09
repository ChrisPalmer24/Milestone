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
  const [analysisResults, setAnalysisResults] = useState<Array<{
    imageIndex: number,
    extractedData: Array<{
      providerName: string,
      accountType?: string,
      amount: number,
      confidence: number
    }>,
    isProcessed: boolean
  }>>([]);
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
    setAnalysisResults((prev) => prev.filter(result => result.imageIndex !== index));
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

      // Clear previous analysis results
      setAnalysisResults([]);
      
      // Process each image and get the results
      const results = await Promise.all(
        uploadedImages.map(async (imageData, imageIndex) => {
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
            
            // Store this image's analysis results
            setAnalysisResults(prev => [
              ...prev, 
              {
                imageIndex,
                extractedData: data.extractedValues,
                isProcessed: true
              }
            ]);
            
            return data.extractedValues;
          } catch (error) {
            console.error("Error processing image:", error);
            
            // Store empty result for this image
            setAnalysisResults(prev => [
              ...prev, 
              {
                imageIndex,
                extractedData: [],
                isProcessed: true
              }
            ]);
            
            return [];
          }
        })
      );

      // Flatten the results and match with asset IDs
      const flatResults = results.flat();
      
      const matchedValues = flatResults
        .map(result => {
          // First try to match by both provider name and account type
          let matchingAsset = null;
          
          // If account type is available in the result, try to match that first
          if (result.accountType) {
            matchingAsset = brokerAssets.find(asset => 
              getProviderName(asset.providerId, brokerProviders ?? []).toLowerCase() === result.accountName.toLowerCase() &&
              asset.accountType.toUpperCase() === result.accountType.toUpperCase()
            );
          }
          
          // If no match by account type or account type wasn't extracted, fall back to just provider name
          if (!matchingAsset) {
            matchingAsset = brokerAssets.find(asset => 
              getProviderName(asset.providerId, brokerProviders ?? []).toLowerCase() === result.accountName.toLowerCase()
            );
          }
          
          if (matchingAsset) {
            // Increase confidence if we matched both provider and account type
            const matchConfidence = (result.accountType && 
              matchingAsset.accountType.toUpperCase() === result.accountType.toUpperCase()) 
              ? Math.min(1, result.confidence + 0.1) : result.confidence;
              
            return {
              assetId: matchingAsset.id,
              value: result.amount,
              confidence: matchConfidence,
              providerName: result.accountName,
              accountType: result.accountType
            };
          }
          return null;
        })
        .filter(Boolean) as { 
          assetId: string; 
          value: number; 
          confidence: number; 
          providerName: string; 
          accountType?: string 
        }[];
      
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
          
          const matchDetails = highConfidenceMatches
            .map(match => {
              const accountTypeStr = match.accountType ? ` (${match.accountType})` : '';
              return `${match.providerName}${accountTypeStr}: £${match.value.toLocaleString()}`;
            })
            .join(', ');
            
          toast({
            title: "Account values detected",
            description: `Found ${highConfidenceMatches.length} account values: ${matchDetails}`,
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload Account Screenshots</DialogTitle>
            <DialogDescription>
              Take screenshots of your account balances and upload them here to automatically fill in the values. The AI will try to identify your accounts by provider name, account type (ISA, SIPP, etc.), and balance amount. This feature is still in beta and is experimental*
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
          
          <div className="mt-2 space-y-1">
            <p className="text-xs italic text-gray-500">
              *We do not store screenshots for security reasons - they are simply read by the AI using OCR to get the figures to make the input process easier for you
            </p>
            <p className="text-xs text-gray-600">
              <strong>Tip:</strong> For best results, ensure your screenshots clearly show both the account name/type (ISA, SIPP, etc.) and current balance. Crop out unnecessary parts of the screen.
            </p>
          </div>

          {uploadedImages.length > 0 && (
            <div className="mt-4 space-y-4">
              {uploadedImages.map((img, index) => {
                const analysisResult = analysisResults.find(r => r.imageIndex === index);
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left column - Screenshot */}
                      <div className="md:w-1/2 relative">
                        <img
                          src={img}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full rounded-md border border-gray-200 object-cover"
                          style={{ maxHeight: "250px" }}
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
                      
                      {/* Right column - Extracted data */}
                      <div className="md:w-1/2 flex flex-col">
                        <h4 className="text-sm font-medium mb-2">Extracted Information</h4>
                        
                        {isProcessing && !analysisResult && (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                            <span className="text-sm">Processing...</span>
                          </div>
                        )}
                        
                        {!isProcessing && !analysisResult && (
                          <div className="text-sm text-gray-500 border border-dashed rounded-md p-3 flex-grow flex items-center justify-center">
                            <p>Click "Extract Account Values" to analyze this screenshot</p>
                          </div>
                        )}
                        
                        {analysisResult && (
                          <>
                            {analysisResult.extractedData.length === 0 ? (
                              <div className="text-sm text-red-500 border border-dashed border-red-200 rounded-md p-3 flex-grow flex items-center justify-center">
                                <p>No account information detected in this screenshot.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {analysisResult.extractedData.map((result, resultIndex) => (
                                  <div 
                                    key={resultIndex} 
                                    className={`border rounded-md p-3 ${
                                      result.confidence > 0.7 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                                    }`}
                                  >
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="text-xs font-medium">Provider:</div>
                                      <div className="text-xs">{result.providerName}</div>
                                      
                                      {result.accountType && (
                                        <>
                                          <div className="text-xs font-medium">Account Type:</div>
                                          <div className="text-xs">{result.accountType}</div>
                                        </>
                                      )}
                                      
                                      <div className="text-xs font-medium">Value:</div>
                                      <div className="text-xs">£{result.amount.toLocaleString()}</div>
                                      
                                      <div className="text-xs font-medium">Confidence:</div>
                                      <div className="text-xs">
                                        {(result.confidence * 100).toFixed(0)}%
                                        {result.confidence < 0.7 && (
                                          <span className="text-yellow-600 ml-1">(Low)</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setUploadedImages([]);
                setAnalysisResults([]);
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