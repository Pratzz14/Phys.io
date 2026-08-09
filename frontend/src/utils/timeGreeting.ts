export function greetingForHour(hour: number): string {
  const normalizedHour = ((Math.trunc(hour) % 24) + 24) % 24;
  if (normalizedHour < 12) return "Good morning";
  if (normalizedHour < 17) return "Good afternoon";
  return "Good evening";
}
