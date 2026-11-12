export const IMAGE_CLIENT_SCRIPT = `
    function formatImageBytes(value) {
      const bytes = Number(value) || 0;
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
      if (bytes >= 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
      return bytes + " B";
    }
    function imageFileLabel(file) {
      const raw = String(file?.name || "背景图片").replace(/\\.[^.]+$/, "");
      return raw.replace(/[\\u0000-\\u001f\\u007f]/g, " ").replace(/\\s+/g, " ").trim().slice(0, 60) || "背景图片";
    }
    function canvasWebp(canvas, quality) {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("当前浏览器无法压缩 WebP。"));
            return;
          }
          if (blob.type && blob.type !== "image/webp") {
            reject(new Error("当前浏览器不支持 WebP 压缩。"));
            return;
          }
          resolve(blob);
        }, "image/webp", quality);
      });
    }
    async function decodeImageFile(file) {
      if (typeof createImageBitmap === "function") {
        try {
          const bitmap = await createImageBitmap(file);
          return {
            source: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            release: () => bitmap.close && bitmap.close(),
          };
        } catch {}
      }
      const objectUrl = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.decoding = "async";
        image.src = objectUrl;
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error("浏览器无法解码这张图片。"));
        });
        return {
          source: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          release: () => URL.revokeObjectURL(objectUrl),
        };
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    }
    async function compressLibraryImage(file, options = {}) {
      const maxBytes = Number(options.maxBytes) || 980000;
      const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};
      if (!file || !String(file.type || "").startsWith("image/")) {
        throw new Error("请选择 PNG、JPEG、WebP 或 AVIF 图片。");
      }
      if (file.size > 32 * 1024 * 1024) {
        throw new Error("原图超过 32 MB，请先换一张更小的图片。");
      }
      onProgress(4, "正在读取图片");
      const decoded = await decodeImageFile(file);
      try {
        if (!decoded.width || !decoded.height) {
          throw new Error("无法读取图片尺寸。");
        }
        const qualities = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48, 0.4];
        let longSide = Math.min(2400, Math.max(decoded.width, decoded.height));
        let attempt = 0;
        let lastSize = 0;
        while (attempt < 8 && longSide >= 320) {
          const scale = longSide / Math.max(decoded.width, decoded.height);
          const width = Math.max(1, Math.round(decoded.width * scale));
          const height = Math.max(1, Math.round(decoded.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("浏览器无法创建图片画布。");
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height, 0, 0, width, height);
          for (let index = 0; index < qualities.length; index += 1) {
            const quality = qualities[index];
            onProgress(
              8 + Math.min(74, Math.round(((attempt * qualities.length + index + 1) / 56) * 74)),
              "压缩 WebP · " + width + "×" + height + " · Q" + Math.round(quality * 100),
            );
            const blob = await canvasWebp(canvas, quality);
            lastSize = blob.size;
            if (blob.size <= maxBytes) {
              onProgress(84, "压缩完成 · " + formatImageBytes(blob.size));
              return { blob, width, height, quality };
            }
          }
          attempt += 1;
          longSide = Math.round(longSide * 0.8);
        }
        throw new Error("压缩后仍有 " + formatImageBytes(lastSize) + "，无法控制到 1 MB 以内。");
      } finally {
        decoded.release();
      }
    }
    async function uploadLibraryImage(blob, options = {}) {
      const endpoint = options.admin ? "/admin/api/images" : "/api/images";
      const label = String(options.label || "").slice(0, 80);
      const response = await fetch(endpoint + "?label=" + encodeURIComponent(label), {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: blob,
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 && options.admin) {
        location.replace("/admin/login");
        throw new Error("管理员会话已失效。");
      }
      if (!response.ok) {
        throw new Error(payload.message || "图片上传失败。");
      }
      return payload;
    }
    function chooseImageFile() {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif,image/avif";
        input.hidden = true;
        document.body.appendChild(input);
        let settled = false;
        const finish = (file) => {
          if (settled) return;
          settled = true;
          input.remove();
          resolve(file || null);
        };
        input.addEventListener("change", () => finish(input.files?.[0] || null), { once: true });
        input.addEventListener("cancel", () => finish(null), { once: true });
        input.click();
      });
    }
`;
