export function compositeImages(iconUrl, backgroundUrl, backgroundColor, size = 600) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (backgroundUrl) {
      const bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.onload = () => {
        ctx.drawImage(bg, 0, 0, size, size);
        drawIcon();
      };
      bg.src = backgroundUrl;
    } else {
      ctx.fillStyle = backgroundColor || "#EDE7F6";
      ctx.fillRect(0, 0, size, size);
      drawIcon();
    }

    function drawIcon() {
      if (!iconUrl) { resolve(canvas.toDataURL()); return; }
      const icon = new Image();
      icon.crossOrigin = "anonymous";
      icon.onload = () => {
        const padding = size * 0.05;
        const iconSize = size - padding * 2;
        
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(icon, padding, padding, iconSize, iconSize);
        ctx.restore();
        
        resolve(canvas.toDataURL());
      };
      icon.src = iconUrl;
    }
  });
}
