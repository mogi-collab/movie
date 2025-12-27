// Lightweight ambient Deno types for editor/tsserver during Node-based tests
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve?: (handler: (req: Request) => Promise<Response> | Response) => void;
  };
}

export {};
