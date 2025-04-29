import { ReadableWritablePair, StreamPipeOptions } from "stream/web";

declare module "@azure/openai" {
  export interface EventStream<T> {
    [Symbol.asyncIterator](): AsyncIterator<T>;
    cancel(reason?: any): Promise<void>;
    getReader(): ReadableStreamDefaultReader<T>;
    locked: boolean;
    pipeThrough<T>(
      transform: ReadableWritablePair<T, T>,
      options?: StreamPipeOptions
    ): ReadableStream<T>;
    pipeTo(
      destination: WritableStream<T>,
      options?: StreamPipeOptions
    ): Promise<void>;
    tee(): [ReadableStream<T>, ReadableStream<T>];
  }
}
