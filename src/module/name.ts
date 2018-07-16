/**
 * Returns valid module name from provided file name.
 * @param {string} fileName File name.
 */

export default function(fileName: string): string {
  const allowed = 'a-zA-Z0-9';
  return fileName
    .replace(new RegExp(`^[^${allowed}]+|[^${allowed}]+$`), '')
    .replace(new RegExp(`[^${allowed}]+([${allowed}])`, 'g'), (_match, $1) =>
      $1.toUpperCase()
    );
}
