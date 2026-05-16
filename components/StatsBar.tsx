"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
const STAT_TARGETS = [
  { value: 2400, suffix: "+", label: " Items Recovered", prefix: "" },
  { value: 98, suffix: "%", label: " Match Accuracy", prefix: "" },
  { value: 2, suffix: "", label: " min Response Time", prefix: "< " },
] as const;

function AnimatedNumber({
  target,
  suffix,
  prefix,
}: {
  target: number;
  suffix: string;
  prefix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1.2 });
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, motionVal, target]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
      }
    });
    return unsub;
  }, [spring, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

export function StatsBar() {
  return (
    <section className="py-6 md:py-8" style={{ backgroundColor: "#1B5E78" }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-5 px-4 text-center text-white sm:flex-row sm:gap-0">
        {STAT_TARGETS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="flex flex-1 items-center justify-center gap-4 sm:px-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            {i > 0 && (
              <span className="hidden h-8 w-px bg-white/30 sm:block" aria-hidden />
            )}
            <p className="text-base font-medium md:text-lg">
              <AnimatedNumber
                target={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
              />
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
