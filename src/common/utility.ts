import * as bcrypt from 'bcrypt';

export const hashText = async (text: string) => {
  const saltOrRounds = 10;
  return await bcrypt.hash(text, saltOrRounds);
};
export const compareHashedText = async (text: string, hash: string) => {
  return await bcrypt.compare(text, hash);
};
