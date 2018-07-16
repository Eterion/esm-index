/**
 * Returns list of duplicated values in array;
 * @param arr Input array.
 */

export default function<T>(arr: T[]): T[] {
  const storage: T[] = [];
  const duplicates: T[] = [];
  arr.forEach(item => {
    storage.includes(item) ? duplicates.push(item) : storage.push(item);
  });
  return duplicates;
}
