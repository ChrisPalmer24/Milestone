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
      accountName: string,
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

  // Resize and pre-process an image to improve OCR results
  const processImageForOCR = (base64Image: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions if the image is too large
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        // Create a canvas to process the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw the resized image on the canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Apply image processing to enhance text visibility (optional)
        try {
          // Get the image data
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Enhance contrast slightly to make text more readable
          for (let i = 0; i < data.length; i += 4) {
            // Apply a simple contrast enhancement
            // This can help OCR with text recognition
            data[i] = data[i] < 120 ? data[i] * 0.8 : Math.min(255, data[i] * 1.2);        // red
            data[i+1] = data[i+1] < 120 ? data[i+1] * 0.8 : Math.min(255, data[i+1] * 1.2); // green
            data[i+2] = data[i+2] < 120 ? data[i+2] * 0.8 : Math.min(255, data[i+2] * 1.2); // blue
            // Alpha channel unchanged
          }
          
          // Put the modified image data back
          ctx.putImageData(imageData, 0, 0);
        } catch (e) {
          console.warn('Image processing enhancement failed, continuing with basic resize:', e);
          // If image processing fails, just continue with the resized image
        }
        
        // Convert the canvas back to a base64 string at a reduced quality
        const processedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
        resolve(processedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = base64Image;
    });
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
            // Process the image before sending it to the server (resize + enhance for OCR)
            const processedImage = await processImageForOCR(imageData);
            console.log(`Original image size: ~${Math.round(imageData.length / 1024)}KB, Processed: ~${Math.round(processedImage.length / 1024)}KB`);
            
            const response = await fetch("/api/ocr/extract-values", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image: processedImage.split(',')[1] || processedImage, // Extract just the base64 part if needed
                providerNames: Array.from(new Set(providerNames)), // Remove duplicates
              }),
            });

            if (!response.ok) {
              try {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
              } catch (e) {
                // If we can't parse the error as JSON, just use the status
                console.error('API error (unparseable):', e);
                throw new Error(`HTTP error! status: ${response.status}`);
              }
            }

            // Parse and log the response
            let data;
            try {
              const responseText = await response.text();
              console.log('Raw API response:', responseText);
              data = JSON.parse(responseText);
              console.log('Parsed API response:', data);
            } catch (parseError) {
              console.error('Error parsing API response:', parseError);
              throw new Error('Failed to parse API response');
            }
            
            // Make sure extractedValues exists and is an array
            const extractedValues = Array.isArray(data.extractedValues) ? data.extractedValues : [];
            
            // Store this image's analysis results
            setAnalysisResults(prev => [
              ...prev, 
              {
                imageIndex,
                extractedData: extractedValues,
                isProcessed: true
              }
            ]);
            
            return extractedValues;
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
          // First try to match by both provider name and account type (highest confidence match)
          let matchingAsset = null;
          
          // If account type is available in the result, try to match that first
          if (result.accountType) {
            matchingAsset = brokerAssets.find(asset => 
              getProviderName(asset.providerId, brokerProviders ?? []).toLowerCase() === result.accountName.toLowerCase() &&
              asset.accountType.toUpperCase() === result.accountType.toUpperCase()
            );
          }
          
          // If no match by both provider and account type, try matching just by account type for known providers
          // This helps when the provider name might be recognized differently than what's in our database
          if (!matchingAsset && result.accountType) {
            // For InvestEngine, we know it has distinctive UI patterns
            if (result.accountName.toLowerCase() === "investengine" || 
                result.accountName.toLowerCase().includes("invest")) {
              matchingAsset = brokerAssets.find(asset => 
                getProviderName(asset.providerId, brokerProviders ?? []).toLowerCase().includes("invest") &&
                asset.accountType.toUpperCase() === result.accountType.toUpperCase()
              );
            }
          }
          
          // Last resort, fall back to just provider name
          if (!matchingAsset) {
            matchingAsset = brokerAssets.find(asset => 
              getProviderName(asset.providerId, brokerProviders ?? []).toLowerCase() === result.accountName.toLowerCase()
            );
          }
          
          if (matchingAsset) {
            // Calculate confidence based on multiple factors
            let matchConfidence = result.confidence;
            
            // Boost confidence for exact provider and account type matches
            if (result.accountType && matchingAsset.accountType.toUpperCase() === result.accountType.toUpperCase()) {
              matchConfidence = Math.min(1, matchConfidence + 0.1);
            }
            
            // Additional confidence boost for InvestEngine with distinctive UI patterns
            if (result.accountName.toLowerCase().includes("invest") && 
                getProviderName(matchingAsset.providerId, brokerProviders ?? []).toLowerCase().includes("invest")) {
              matchConfidence = Math.min(1, matchConfidence + 0.15);
            }
              
            return {
              assetId: matchingAsset.id,
              value: result.amount,
              confidence: matchConfidence,
              providerName: result.accountName, // Use accountName from API result as providerName
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
            <p className="text-xs text-gray-600">
              <strong>InvestEngine users:</strong> Make sure the "Portfolio balance" text and your account value are clearly visible in the screenshot. These are usually displayed at the top of your account page.
            </p>
            <p className="text-xs text-gray-600">
              If recognition fails, try a different part of your account screen or a clearer screenshot with less glare.
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
                              <div className="text-sm text-red-500 border border-dashed border-red-200 rounded-md p-3 flex-grow flex flex-col gap-2 justify-center">
                                <p className="text-center">No account information detected in this screenshot.</p>
                                <div className="text-xs text-gray-500 text-center">
                                  <p>Tips: Make sure the screenshot clearly shows:</p>
                                  <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>The account balance with currency symbol (£)</li>
                                    <li>For InvestEngine, the "Portfolio balance" label</li>
                                    <li>Account type indicators like "ISA" if possible</li>
                                  </ul>
                                </div>
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
                                      <div className="text-xs flex items-center">
                                        {result.accountName}
                                        {result.accountName.toLowerCase().includes('invest') && (
                                          <span className="ml-1 px-1 text-[10px] bg-blue-100 text-blue-700 rounded">InvestEngine</span>
                                        )}
                                      </div>
                                      
                                      {result.accountType && (
                                        <>
                                          <div className="text-xs font-medium">Account Type:</div>
                                          <div className="text-xs flex items-center">
                                            {result.accountType}
                                            {result.accountType.toUpperCase() === 'ISA' && (
                                              <span className="ml-1 px-1 text-[10px] bg-green-100 text-green-700 rounded">Stocks & Shares ISA</span>
                                            )}
                                          </div>
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