type Gesture = 'tap' | 'double-tap' | 'swipe-up' | 'swipe-down' | 'long-press';
type Handler = (type: Gesture, payload?: { deltaX?: number; deltaY?: number }) => void;

export class TouchGesture {
  private el: HTMLElement;
  private startX = 0; private startY = 0; private lastTap = 0; private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: Map<Gesture, Handler> = new Map();
  private readonly SWIPE_THRESHOLD = 50;
  private readonly DOUBLE_TAP_WINDOW = 300;
  private readonly LONG_PRESS_DELAY = 600;
  private _start: ((e: TouchEvent) => void) | null = null;
  private _move: (() => void) | null = null;
  private _end: ((e: TouchEvent) => void) | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.bind();
  }

  on(type: Gesture, cb: Handler) { this.handlers.set(type, cb); return () => this.handlers.delete(type); }

  private bind() {
    this._start = (e: TouchEvent) => {
      this.startX = e.touches[0].clientX; this.startY = e.touches[0].clientY;
      this.longPressTimer = setTimeout(() => this.fire('long-press'), this.LONG_PRESS_DELAY);
    };
    this._move = () => {
      if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
    };
    this._end = (e: TouchEvent) => {
      if (this.longPressTimer) clearTimeout(this.longPressTimer);
      const dx = e.changedTouches[0].clientX - this.startX;
      const dy = e.changedTouches[0].clientY - this.startY;

      if (Math.abs(dx) > this.SWIPE_THRESHOLD || Math.abs(dy) > this.SWIPE_THRESHOLD) {
        if (Math.abs(dy) > Math.abs(dx)) { this.fire((dy > 0 ? 'swipe-down' : 'swipe-up') as Gesture, { deltaY: dy }); }
        else { this.fire('tap'); }
        return;
      }

      const now = Date.now();
      if (now - this.lastTap < this.DOUBLE_TAP_WINDOW) { this.fire('double-tap'); this.lastTap = 0; }
      else { this.fire('tap'); this.lastTap = now; }
    };

    this.el.addEventListener('touchstart', this._start, { passive: true });
    this.el.addEventListener('touchmove', this._move, { passive: true });
    this.el.addEventListener('touchend', this._end, { passive: true });
  }

  private fire(type: Gesture, payload?: { deltaX?: number; deltaY?: number }) { this.handlers.get(type)?.(type, payload); }

  destroy() {
    if (this._start) this.el.removeEventListener('touchstart', this._start);
    if (this._move) this.el.removeEventListener('touchmove', this._move);
    if (this._end) this.el.removeEventListener('touchend', this._end);
    this.handlers.clear();
  }
}
