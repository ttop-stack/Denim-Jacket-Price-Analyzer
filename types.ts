
export interface EstimationResult {
  priceRange: string;
  justification: string;
  details: {
    style: string;
    condition: string;
    brand?: string;
  };
}
