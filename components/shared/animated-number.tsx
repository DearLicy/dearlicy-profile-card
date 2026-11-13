"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

export function AnimatedNumber({
  value,
  format = (next) => new Intl.NumberFormat("zh-CN").format(next),
}: {
  value: number;
  format?: (value: number) => string;
}) {
  const reduceMotion = useReducedMotion();
  const current = useMotionValue(reduceMotion ? value : 0);
  const text = useTransform(current, (latest) => format(Math.round(latest)));

  React.useEffect(() => {
    if (reduceMotion) {
      current.set(value);
      return;
    }
    const controls = animate(current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [current, reduceMotion, value]);

  return <motion.span>{text}</motion.span>;
}
