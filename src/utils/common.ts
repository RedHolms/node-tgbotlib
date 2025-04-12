export function generateUniqueKey(length: number = 64): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-0123456789";
  const charactersLength = characters.length;

  let result = "";
  let counter = 0;

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    ++counter;
  }

  return result;
}
