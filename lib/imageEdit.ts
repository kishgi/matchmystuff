export type EditState = {
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const defaultEditState: EditState = {
  rotation: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

function rotatedDimensions(
  width: number,
  height: number,
  rotationDeg: number,
): { width: number; height: number } {
  const rotation = ((rotationDeg % 360) + 360) % 360;
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/** Render crop/rotate/zoom edits to a square JPEG blob. */
export async function renderEditedImage(
  file: File,
  state: EditState = defaultEditState,
  outputSize = 1200,
): Promise<Blob> {
  const img = await loadImage(file);
  const rotation = ((state.rotation % 360) + 360) % 360;
  const { width: rw, height: rh } = rotatedDimensions(
    img.naturalWidth,
    img.naturalHeight,
    rotation,
  );

  const work = document.createElement("canvas");
  work.width = rw;
  work.height = rh;
  const wctx = work.getContext("2d");
  if (!wctx) throw new Error("Canvas not supported");

  wctx.translate(rw / 2, rh / 2);
  wctx.rotate((rotation * Math.PI) / 180);
  wctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const cropSize = outputSize;
  const out = document.createElement("canvas");
  out.width = cropSize;
  out.height = cropSize;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported");

  const baseScale = Math.max(cropSize / rw, cropSize / rh);
  const scale = baseScale * state.scale;
  const drawW = rw * scale;
  const drawH = rh * scale;
  const dx = (cropSize - drawW) / 2 + state.offsetX;
  const dy = (cropSize - drawH) / 2 + state.offsetY;

  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, cropSize, cropSize);
  octx.drawImage(work, dx, dy, drawW, drawH);

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export image"));
      },
      "image/jpeg",
      0.92,
    );
  });
}
