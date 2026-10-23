/**
 * Liste der Überschriften / Slogans für den Casino-Header
 */
export const SLOT_HEADINGS: string[] = [
  "GIG - Gambling ist Geil!",
  "Alge, Alge, Alge!",
  "G steht für Gönnen!",
  "Kohle, Kohle, Kohle",
  "Habicht hat zwei H!",
  "Ich bin doch nicht blöd!",
  "Alles auf blau!",
  "Das Glück ist mit den Dummen",
  "Schach->Matt",
  "Setzen, lachen, verlieren",
  "…und wir gehen rein",
  "Tims Gamblingparadies",
  "Tim Fly ist auch dabei",
  "Und ab geht er der Peter",
  "Der Schornsteinfeger gewinnt!",
  "...ich bin nicht süchtig",
  "Die Gewinne müssen nicht versteuert werden",
  "Wer nicht mitmacht hat schon verloren :(",
];

/**
 * Wählt einen zufälligen Spruch aus der Liste.
 * Falls mehr als ein Eintrag existiert, wird verhindert,
 * dass derselbe Spruch direkt hintereinander doppelt gewählt wird.
 */
export function getRandomSlotHeading(currentHeading?: string): string {
  if (!SLOT_HEADINGS || SLOT_HEADINGS.length === 0) {
    return "GIG - Gambling ist Geil!";
  }
  if (SLOT_HEADINGS.length === 1) {
    return SLOT_HEADINGS[0];
  }
  const pool = currentHeading
    ? SLOT_HEADINGS.filter((item) => item !== currentHeading)
    : SLOT_HEADINGS;
  const items = pool.length > 0 ? pool : SLOT_HEADINGS;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}
