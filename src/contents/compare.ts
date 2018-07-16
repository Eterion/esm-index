import hash from './hash';

/**
 * Returns true if no differences are found between provided data strings.
 * @param data List of data strings to be compared.
 */

export default function(...data: string[]): boolean {
  return data
    .slice(1)
    .map(item => hash(data[0]) == hash(item))
    .includes(false);
}
