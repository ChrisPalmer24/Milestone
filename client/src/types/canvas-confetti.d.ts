declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    /**
     * The number of confetti particles (default: 50).
     */
    particleCount?: number;
    
    /**
     * The angle in which to launch the confetti particles, in degrees (default: 90).
     */
    angle?: number;
    
    /**
     * The spread of the confetti particles, in degrees (default: 45).
     */
    spread?: number;
    
    /**
     * The starting x position of the confetti particles (default: 0.5).
     */
    startVelocity?: number;
    
    /**
     * How quickly the particles decelerate (default: 0.9).
     */
    decay?: number;
    
    /**
     * Gravity value for the particles (default: 1).
     */
    gravity?: number;
    
    /**
     * How quickly the particles drift horizontally (default: 0).
     */
    drift?: number;
    
    /**
     * Random "wobble" of the particles as they fall (default: 0).
     */
    ticks?: number;
    
    /**
     * The origin point for the particles, where [0,0] is the top left corner
     * and [1,1] is the bottom right corner (default: {x: 0.5, y: 0.5}).
     */
    origin?: {
      x?: number;
      y?: number;
    };
    
    /**
     * An array of colors to use for the confetti particles (default: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']).
     */
    colors?: string[];
    
    /**
     * Confetti shapes to use. If not specified, only round particles will be used.
     */
    shapes?: Array<'circle' | 'square' | 'star'>;
    
    /**
     * A multiplier to apply to the size of the confetti particles.
     */
    scalar?: number;
    
    /**
     * Custom canvas width for the confetti animation.
     */
    width?: number;
    
    /**
     * Custom canvas height for the confetti animation.
     */
    height?: number;
    
    /**
     * Whether to use the canvas dimensions and position.
     */
    useWorker?: boolean;
    
    /**
     * Number of frames to run the animation for.
     */
    disableForReducedMotion?: boolean;
  }
  
  /**
   * Launch confetti particles from a canvas.
   * @param options The confetti options.
   * @returns A promise that resolves when the confetti animation is complete.
   */
  function confetti(options?: ConfettiOptions): Promise<void>;
  
  export default confetti;
}