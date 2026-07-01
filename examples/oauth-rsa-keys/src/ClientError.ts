export class ClientError extends Error {
  fileName: string;
  methodName: string;

  constructor(message: string, fileName: string, methodName: string) {
    super(message);
    this.fileName = fileName;
    this.methodName = methodName;
  }
}
