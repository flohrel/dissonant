export class Duration {
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

  constructor(private totalMs?: number) {
    if (!this.totalMs) return;
    const seconds = Math.floor(this.totalMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    this.hours = hours;
    this.minutes = minutes % 60;
    this.seconds = seconds % 60;
  }

  formatHHMMSS(): string {
    return (
      (this.hours > 0 ? this.hours.toString().padStart(2, '0') + 'h ' : '') +
      `${this.minutes.toString().padStart(2, '0')}m ${this.seconds.toString().padStart(2, '0')}s `
    );
  }

  formatMMSS(): string {
    return (
      this.minutes.toString().padStart(2, '0') +
      ':' +
      this.seconds.toString().padStart(2, '0')
    );
  }
}
