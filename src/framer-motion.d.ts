declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps extends React.HTMLAttributes<HTMLElement>, React.SVGAttributes<SVGElement> {
    initial?: boolean | object;
    animate?: object;
    exit?: object;
    transition?: object;
    whileHover?: object;
    whileTap?: object;
    whileDrag?: object;
    whileFocus?: object;
    whileInView?: object;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: false | { left?: number; right?: number; top?: number; bottom?: number };
    dragDirectionLock?: boolean;
    dragElastic?: number;
    dragMomentum?: boolean;
    dragPropagation?: boolean;
    dragSnapToOrigin?: boolean;
    layout?: boolean | 'position' | 'size';
    layoutId?: string;
    layoutRoot?: boolean;
    layoutDependency?: React.DependencyList;
    onLayoutMeasure?: (bbox: { x: number; y: number; width: number; height: number }) => void;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onUpdate?: (latest: any) => void;
    onDragStart?: (event: any, info: any) => void;
    onDrag?: (event: any, info: any) => void;
    onDragEnd?: (event: any, info: any) => void;
    onDragTransitionEnd?: (event: any, info: any) => void;
    onHoverStart?: (event: any) => void;
    onHoverEnd?: (event: any) => void;
    onViewportEnter?: (entry: any) => void;
    onViewportLeave?: (entry: any) => void;
    style?: React.CSSProperties;
  }

  // Allow any additional props for motion components
  export type MotionComponent<T extends React.ElementType> = React.ForwardRefExoticComponent<
    React.ComponentPropsWithoutRef<T> & MotionProps & React.RefAttributes<any>
  >;

  export const motion: {
    [K in keyof JSX.IntrinsicElements]: MotionComponent<K>;
  } & {
    <T extends React.ElementType>(Component: T): MotionComponent<T>;
  };

  export interface AnimatePresenceProps {
    children: React.ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
  }

  export const AnimatePresence: React.FC<AnimatePresenceProps>;

  export interface MotionValue {
    get(): number;
    set(v: number): void;
    onChange(callback: (v: number) => void): () => void;
  }

  export function useMotionValue(initial: number): MotionValue;
  export function useTransform(input: MotionValue | MotionValue[], transformer: (v: number) => number): MotionValue;
  export function useSpring(value: MotionValue, config?: any): MotionValue;
  export function useScroll(): { scrollX: MotionValue; scrollY: MotionValue; scrollXProgress: MotionValue; scrollYProgress: MotionValue };
  export function useAnimationControls(): any;
  export function useReducedMotion(): boolean;
  
  export const m: typeof motion;
}

declare module 'motion' {
  export * from 'framer-motion';
}

declare module 'motion/react' {
  export * from 'framer-motion';
}