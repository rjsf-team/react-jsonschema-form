import * as emotionSerializer from '@emotion/jest/serializer';

global.structuredClone = (val) => {
  if (!val) {
    return val;
  }
  return JSON.parse(JSON.stringify(val));
};

expect.addSnapshotSerializer(emotionSerializer);
