declare module 'tasklist' {
  interface ProcessDescriptor {
    readonly imageName?: string;
    readonly pid?: number;
    readonly sessionNumber?: number;
    readonly sessionName?: string;
  }

  export default function tasklist(): Promise<ProcessDescriptor[]>;
}
