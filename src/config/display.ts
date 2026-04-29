export function shortZoneName(name: string): string {
  return name.replace(/^[A-Za-z]+ \d+: /, "");
}
