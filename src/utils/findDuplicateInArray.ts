/**
 * Return a list of duplicated values in array.
 * @param {array} arr Input array.
 */

export default function<T>(arr: T[]): T[] {
  const uniqueValues: T[] = [];
  const duplicatedValues: T[] = [];
  arr.forEach(item => {
    uniqueValues.includes(item)
      ? duplicatedValues.push(item)
      : uniqueValues.push(item);
  });
  return duplicatedValues;
}
