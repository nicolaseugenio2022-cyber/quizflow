"use client";

/**
 * BlurText — adapted from React Bits (https://reactbits.dev/text-animations/blur-text),
 * installed with `npx shadcn@latest add @react-bits/BlurText-TS-TW`.
 *
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0.
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software. Full license:
 * https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
 *
 * QuizFlow changes:
 * - Renders as a configurable element (for example `h1`) instead of a `p`.
 * - Exposes the full text once to assistive technology; animated segments are
 *   hidden from the accessibility tree.
 * - Renders static text when the user prefers reduced motion (after
 *   hydration, so server and client markup match).
 * - Accepts `className` through `cn` so QuizFlow tokens apply.
 */

import {
  motion,
  useReducedMotion,
  type Easing,
  type Transition,
} from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
} from "react";

import { cn } from "@/lib/utils";

type Keyframe = Record<string, string | number>;

type BlurTextProps = {
  text: string;
  as?: ElementType;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Keyframe;
  animationTo?: Keyframe[];
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

const buildKeyframes = (
  from: Keyframe,
  steps: Keyframe[],
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([
    ...Object.keys(from),
    ...steps.flatMap((step) => Object.keys(step)),
  ]);
  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach((key) => {
    keyframes[key] = [from[key], ...steps.map((step) => step[key])];
  });
  return keyframes;
};

const subscribeNoop = () => () => {};

export function BlurText({
  text,
  as: Component = "p",
  delay = 200,
  className,
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  // Decide after hydration: the server cannot know the user's motion
  // preference, so the first client render must match the server output.
  // CSS in globals.css keeps the text visible until then.
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const prefersReducedMotion = useReducedMotion() === true && hydrated;
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, prefersReducedMotion]);

  const fromSnapshot = useMemo<Keyframe>(
    () =>
      animationFrom ?? {
        filter: "blur(10px)",
        opacity: 0,
        y: direction === "top" ? -50 : 50,
      },
    [animationFrom, direction],
  );

  const toSnapshots = useMemo<Keyframe[]>(
    () =>
      animationTo ?? [
        { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 5 : -5 },
        { filter: "blur(0px)", opacity: 1, y: 0 },
      ],
    [animationTo, direction],
  );

  if (prefersReducedMotion) {
    return <Component className={className}>{text}</Component>;
  }

  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1),
  );

  return (
    <Component
      ref={ref}
      data-motion="blur-text"
      aria-label={text}
      className={cn("flex flex-wrap", className)}
    >
      {elements.map((segment, index) => {
        const spanTransition: Transition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing,
        };

        return (
          <motion.span
            key={index}
            aria-hidden="true"
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={
              index === elements.length - 1 ? onAnimationComplete : undefined
            }
            style={{
              display: "inline-block",
              willChange: "transform, filter, opacity",
            }}
          >
            {segment === " " ? " " : segment}
            {animateBy === "words" && index < elements.length - 1 && " "}
          </motion.span>
        );
      })}
    </Component>
  );
}
