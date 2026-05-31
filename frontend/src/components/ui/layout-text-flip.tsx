"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  text = "",
  textAfter = "",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
}: {
  text?: string;
  textAfter?: string;
  words: string[];
  duration?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {text && (
        <motion.span
          className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-none text-[var(--color-text-primary)]"
        >
          {text}
        </motion.span>
      )}

      <motion.span
        layout
        className="relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-4 py-1.5 font-sans text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[var(--color-text-primary)] shadow-sm dark:bg-[var(--color-bg-subtle)]"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -30, filter: "blur(6px)", opacity: 0 }}
            animate={{
              y: 0,
              filter: "blur(0px)",
              opacity: 1,
            }}
            exit={{ y: 30, filter: "blur(6px)", opacity: 0 }}
            transition={{
              duration: 0.45,
              ease: "easeOut",
            }}
            className={cn("inline-block whitespace-nowrap")}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>

      {textAfter && (
        <motion.span
          className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-none text-[var(--color-text-primary)]"
        >
          {textAfter}
        </motion.span>
      )}
    </span>
  );
};
