interface ScoreData { score: number; hearts: number; time: number; rank?: string; seed: string; }

export const scoreCardGen = {
  async generate(data: ScoreData, theme: Record<string, string> = {}): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    canvas.width = 1080; canvas.height = 1920;

    ctx.fillStyle = theme.bg || '#151028';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme.primary || '#fda9ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 120px system-ui, -apple-system, sans-serif';
    ctx.fillText("DON'T TOUCH PURPLE", canvas.width / 2, 250);

    ctx.font = 'bold 200px system-ui';
    ctx.fillStyle = theme.accent || '#f9bd22';
    ctx.fillText(data.score.toLocaleString(), canvas.width / 2, 650);

    ctx.font = '80px system-ui';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`❤️ ${data.hearts} | ⏱️ ${data.time}s | 🌱 ${data.seed || 'N/A'}`, canvas.width / 2, 900);

    if (data.rank) {
      ctx.font = 'bold 90px system-ui';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(`Rank: ${data.rank}`, canvas.width / 2, 1100);
    }

    ctx.font = 'italic 60px system-ui';
    ctx.fillStyle = '#888888';
    ctx.fillText('Share your progress!', canvas.width / 2, 1600);
    ctx.font = '40px monospace';
    ctx.fillText('game.mscarabia.com', canvas.width / 2, 1700);

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ''), 'image/png'));
  }
};
