type ScheduledCallback = () => void;

type ScheduledItem = {
  id: number;
  runAtMs: number;
  callback: ScheduledCallback;
};

export class Scheduler {
  private nextId = 1;
  private readonly queue: ScheduledItem[] = [];

  public scheduleAt(runAtMs: number, callback: ScheduledCallback): number {
    const id = this.nextId;
    this.nextId += 1;
    this.queue.push({ id, runAtMs, callback });
    this.queue.sort((a, b) => a.runAtMs - b.runAtMs || a.id - b.id);
    return id;
  }

  public scheduleIn(currentTimeMs: number, delayMs: number, callback: ScheduledCallback): number {
    return this.scheduleAt(currentTimeMs + delayMs, callback);
  }

  public runDue(currentTimeMs: number): void {
    while (this.queue.length > 0 && this.queue[0].runAtMs <= currentTimeMs) {
      const item = this.queue.shift();
      item?.callback();
    }
  }

  public clear(): void {
    this.queue.length = 0;
  }
}
