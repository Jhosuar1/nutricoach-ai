export async function prepareScanImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.65, 0.45]) {
      const previewUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = previewUrl.split(",")[1];
      if (base64 && base64.length <= 2_800_000) {
        return { base64, mediaType: "image/jpeg", previewUrl };
      }
    }
    throw new Error("La foto es demasiado grande");
  } finally {
    URL.revokeObjectURL(url);
  }
}
