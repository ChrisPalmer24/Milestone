declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: Array<'circle' | 'square' | 'star'>;
    scalar?: number;
    width?: number;
    height?: number;
    useWorker?: boolean;
    disableForReducedMotion?: boolean;
  }
  
  function confetti(options?: ConfettiOptions): Promise<void>;
  
  export default confetti;
}