/**
 * Options for Draco.
 */
export interface Options {
    /**
     * Empty means all.
     */
    constraints?: string[];
  
    /**
     * Weight for the soft constraints.
     */
    weights?: Array<{
      name: string;
      value: number;
    }>;
  
    /**
     * Number of models.
     */
    models?: number;
  
    /**
     * If true, hard constraints will not be strictly enforced, instead
     * incurring an infinite cost.
     */
    relaxHard?: boolean;
  }