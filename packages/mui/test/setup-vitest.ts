import * as emotionSerializer from '@emotion/jest/serializer';

expect.addSnapshotSerializer(emotionSerializer as any);
