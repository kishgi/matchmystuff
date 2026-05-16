import Image from "next/image";

type LogoProps = {
  height?: number;
  className?: string;
};

export function Logo({ height = 48, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={height * 2}
      height={height}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ height }}
      priority
    />
  );
}
