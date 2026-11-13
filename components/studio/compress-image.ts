export async function compressWebp(
  file: File,
  onProgress: (percent: number, label: string) => void,
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择 PNG、JPEG、WebP 或 AVIF 图片。");
  }
  if (file.size > 32 * 1024 * 1024) {
    throw new Error("原图超过 32 MB，请先选择更小的图片。");
  }
  onProgress(4, "正在读取图片");
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height) throw new Error("无法读取图片尺寸。");
    const qualities = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48, 0.4];
    let longSide = Math.min(2400, Math.max(bitmap.width, bitmap.height));
    let attempt = 0;
    let lastSize = 0;
    while (attempt < 8 && longSide >= 320) {
      const scale = longSide / Math.max(bitmap.width, bitmap.height);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器无法创建图片画布。");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);
      for (let index = 0; index < qualities.length; index += 1) {
        onProgress(
          8 + Math.min(72, Math.round(((attempt * qualities.length + index + 1) / 56) * 72)),
          `压缩 WebP · ${width}×${height} · Q${Math.round(qualities[index] * 100)}`,
        );
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (!result || result.type !== "image/webp") {
                reject(new Error("当前浏览器不支持 WebP 压缩。"));
              } else {
                resolve(result);
              }
            },
            "image/webp",
            qualities[index],
          );
        });
        lastSize = blob.size;
        if (blob.size <= 980_000) {
          onProgress(84, `压缩完成 · ${(blob.size / 1024).toFixed(0)} KB`);
          return { blob, width, height };
        }
      }
      attempt += 1;
      longSide = Math.round(longSide * 0.8);
    }
    throw new Error(
      `压缩后仍有 ${(lastSize / 1024).toFixed(0)} KB，无法控制在 1 MB 以内。`,
    );
  } finally {
    bitmap.close();
  }
}

export function uploadWebp(
  endpoint: string,
  blob: Blob,
  category: string,
  label: string,
  onProgress: (percent: number) => void,
) {
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${endpoint}?category=${encodeURIComponent(category)}&label=${encodeURIComponent(label)}`,
    );
    xhr.setRequestHeader("Content-Type", "image/webp");
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(86 + Math.round((event.loaded / event.total) * 12));
      }
    });
    xhr.addEventListener("load", () => {
      let payload: any = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(payload);
      } else {
        reject(new Error(payload.message || "图片上传失败。"));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("图片上传失败。")));
    xhr.send(blob);
  });
}
