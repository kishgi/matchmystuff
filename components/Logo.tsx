import Image from "next/image";

type LogoProps = {
  height?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ height = 48, className = "", priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={height * 3}
      height={height}
      className={`object-contain ${className}`}
      style={{ height, width: "auto" }}
      priority={priority}
    />
  );
}
