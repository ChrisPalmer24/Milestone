import { Router } from 'express';
import { z } from 'zod';
import { extractAccountValuesFromImage } from '../services/anthropic';
import { log, error } from '../log';
import { AuthRequest } from '../auth/types';

const processImageSchema = z.object({
  imageData: z.string(),
  providerNames: z.array(z.string()),
});

export async function registerRoutes(router: Router) {
  router.post('/extract-values', async (req: AuthRequest, res) => {
    try {
      const validatedData = processImageSchema.parse(req.body);
      
      // Validate that imageData is a base64 encoded string
      if (!validatedData.imageData.startsWith('data:image')) {
        return res.status(400).json({ 
          error: 'Invalid image format. Please provide a base64 encoded image.' 
        });
      }
      
      // Extract the base64 data part from the string (after the comma)
      const base64Data = validatedData.imageData.split(',')[1];
      if (!base64Data) {
        return res.status(400).json({ 
          error: 'Invalid image data format.' 
        });
      }
      
      // Process the image
      const extractedValues = await extractAccountValuesFromImage(
        base64Data,
        validatedData.providerNames
      );
      
      return res.status(200).json({ extractedValues });
    } catch (err) {
      error(`Error processing image: ${err}`);
      
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: err.errors 
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to process image' 
      });
    }
  });

  return router;
}