/**
 * Run a request, and if it has not settled after delayMs, start a second identical one and take
 * whichever finishes first. Measured on the plan call: most runs take 5 to 7 s, about one in seven
 * takes 20 to 50 s, and the slow runs are independent of each other.
 * If the first attempt fails before the delay, the second starts at once (one retry).
 */
export function hedged<T>(run: (signal: AbortSignal) => Promise<T>, delayMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const controllers: AbortController[] = [];
    let started = 0;
    let pending = 0;
    let settled = false;

    const start = () => {
      if (settled || started >= 2) return;
      started++;
      pending++;
      const controller = new AbortController();
      controllers.push(controller);
      run(controller.signal).then(
        (value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          controllers.forEach((c) => c !== controller && c.abort());
          resolve(value);
        },
        (err) => {
          pending--;
          if (settled) return;
          if (started < 2) {
            clearTimeout(timer);
            start();
          } else if (pending === 0) {
            settled = true;
            reject(err);
          }
        },
      );
    };

    const timer = setTimeout(start, delayMs);
    start();
  });
}
