function parallel(promises, finish, concurrency) {
  let running = 0;
  let processed = 0;
  let index = 0;
  const { length } = promises;

  if (!concurrency) concurrency = length;
  else if (concurrency > length) concurrency = length;

  function spawn() {
    while (concurrency > running && length > index) {
      const currentTask = promises[index++];
      Promise.resolve(currentTask.then(done));
      running++;
    }
  }

  function done() {
    if (++processed === length) return finish();
    running--, processed++;
    spawn();
  }
  spawn();
}

export { parallel };
