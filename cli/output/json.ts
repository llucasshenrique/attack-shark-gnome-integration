export type JsonWriter = (line: string) => void;

export const bunStdoutWriter: JsonWriter = (line) => {
  Bun.stdout.write(line);
};

export const writeJson = (obj: unknown, writer: JsonWriter = bunStdoutWriter): void => {
  try {
    writer(`${JSON.stringify(obj)}\n`);
  } catch (error) {
    writer(`${JSON.stringify({ error: 'Internal serialization error', details: String(error) })}\n`);
  }
};
