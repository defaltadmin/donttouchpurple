export class InputBuffer {
  private queue: { id: string; timestamp: number }[] = [];
  private readonly debounceMs = 120;
  private readonly maxQueue = 3;

  register(id: string): boolean {
    const now = performance.now();
    this.queue = this.queue.filter(item => now - item.timestamp < 1000);
    if (this.queue.some(item => item.id === id && now - item.timestamp < this.debounceMs)) return false;
    if (this.queue.length >= this.maxQueue) this.queue.shift();
    this.queue.push({ id, timestamp: now });
    return true;
  }

  clear() { this.queue = []; }
}
