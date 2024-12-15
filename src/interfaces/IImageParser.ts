export interface IImageParser<T> {
  parseImage(image: File | Buffer | string): Promise<T>;
}
