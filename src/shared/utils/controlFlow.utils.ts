function parallel(promises, finish, concurrency) {
  let running = 0;
  let processed = 0;
  let index = 0;
  const { length } = promises;

  if (!concurrency) concurrency = length;
  else if (concurrency > length) concurrency = length;

  function spawn() {
    function done() {
      if (++processed === length) return finish();
      // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions,no-sequences
      running--, processed++;
      return spawn();
    }

    while (concurrency > running && length > index) {
      const currentTask = promises[index++];
      Promise.resolve(currentTask.then(done));
      running++;
    }
  }
  spawn();
}

export { parallel };
