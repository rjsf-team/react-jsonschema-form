export default function localToUTC(dateString: string) {
  return dateString ? new Date(dateString).toJSON() : undefined;
}
