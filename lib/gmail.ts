/** Gmail はドットと +alias を無視する。Googleログインと同じ形に揃える。 */
export function canonicalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at < 1) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.split('+')[0].replace(/\./g, '');
  }
  return `${local}@${domain}`;
}

export function isGmailAddress(email: string): boolean {
  return canonicalizeEmail(email).endsWith('@gmail.com');
}
