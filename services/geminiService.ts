import { GoogleGenAI, Type } from "@google/genai";
import { EstimationResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    priceRange: {
      type: Type.STRING,
      description: "A string representing the estimated price range, e.g., '$50 - $75'.",
    },
    justification: {
      type: Type.STRING,
      description: "A brief, one or two sentence justification for the estimated price.",
    },
    details: {
      type: Type.OBJECT,
      properties: {
        style: {
          type: Type.STRING,
          description: "The style of the jacket, e.g., 'Classic Trucker', 'Sherpa-lined', 'Distressed'."
        },
        condition: {
          type: Type.STRING,
          description: "The condition of the jacket, e.g., 'New with tags', 'Excellent used condition', 'Visible wear'."
        },
        brand: {
          type: Type.STRING,
          description: "The identified brand of the jacket. If not identifiable, this should be 'Unbranded' or 'Unknown'."
        }
      },
      required: ["style", "condition"]
    }
  },
  required: ["priceRange", "justification", "details"],
};


export const estimateDenimJacketPrice = async (
  base64Images: string[]
): Promise<EstimationResult> => {
  try {
    const imageParts = base64Images.map(base64Image => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image,
      },
    }));

    const textPart = {
      text: "Analyze these frames from a short video of a denim jacket. Pay close attention to details from all angles, including any brand tags, signs of wear, and unique features. Based on a comprehensive analysis of all frames, estimate the jacket's potential resale price on a platform like eBay. Provide a price range, a brief justification, and specific details about the item.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const result: EstimationResult = JSON.parse(jsonString);
    return result;

  } catch (error) {
    console.error("Error estimating price:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get estimation from AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred while estimating the price.");
  }
};