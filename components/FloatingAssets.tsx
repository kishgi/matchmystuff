"use client";

import Image, { type StaticImageData } from "next/image";
import { motion } from "framer-motion";
import bag from "@/assets/Bag.png";
import key from "@/assets/Key.png";
import laptop from "@/assets/Laptop.png";
import headphone from "@/assets/Headphone.png";
import phone from "@/assets/Phone.png";
import purse from "@/assets/Purse.png";

type AssetItem = {
  src: StaticImageData;
  width: number;
  left: string;
  top: string;
  duration: number;
};

const assets: AssetItem[] = [
  { src: bag, width: 110, left: "6%", top: "10%", duration: 10 },
  { src: phone, width: 90, left: "72%", top: "14%", duration: 12 },
  { src: key, width: 70, left: "52%", top: "52%", duration: 9 },
  { src: laptop, width: 130, left: "18%", top: "58%", duration: 14 },
  { src: headphone, width: 85, left: "78%", top: "68%", duration: 8 },
  { src: purse, width: 100, left: "38%", top: "24%", duration: 11 },
];

export function FloatingAssets({ className = "" }: { className?: string }) {
  return (
    <motion.div className={`pointer-events-none absolute inset-0 hidden overflow-hidden md:block ${className}`}>
      {assets.map((item, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: item.left, top: item.top, width: item.width }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 4, 0] }}
          transition={{ duration: item.duration, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={item.src}
            alt=""
            width={item.width}
            height={item.width}
            className="h-auto w-full drop-shadow-lg"
            priority={i < 2}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
