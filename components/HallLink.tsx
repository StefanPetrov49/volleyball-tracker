/** Google Maps search link for a hall name. Opens the Maps app on phones. */
export function mapsUrl(hall: string): string {
  // ", България" helps short names like "Славия" find the right place
  const query = /българия|bulgaria/i.test(hall) ? hall : `${hall}, България`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

type Props = { location: string | null | undefined };

/** Hall name as a Google Maps link, or "Няма зала" when empty. */
export default function HallLink({ location }: Props) {
  const hall = location?.trim();
  if (!hall) return <>Няма зала</>;

  return (
    <a
      className="hall-link"
      href={mapsUrl(hall)}
      target="_blank"
      rel="noopener noreferrer"
      title="Отвори в Google Maps"
    >
      {hall}
    </a>
  );
}
