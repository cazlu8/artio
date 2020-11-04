export default class BaseGateway {
  async addToHashList(
    redisClient: any,
    keyName: string,
    key: string | number,
    socketId: string,
  ): Promise<void> {
    const currentValues = JSON.parse(await redisClient.hget(keyName, key));
    if (currentValues) {
      await redisClient.hset(
        keyName,
        key,
        JSON.stringify(currentValues.concat(socketId)),
      );
    } else await redisClient.hset(keyName, key, JSON.stringify([socketId]));
  }

  async removeFromHashList(
    redisClient: any,
    keyName: string,
    key: string | number,
    socketId: string,
  ): Promise<void> {
    const currentValues = JSON.parse(
      (await redisClient.hget(keyName, key)) || [],
    );
    const newValues = currentValues.filter((x) => x !== socketId);
    await redisClient.hset(keyName, key, JSON.stringify(newValues));
  }
}
