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
  "Alles auf rot!",
  "Das Glück ist mit den Dummen",
  "Schach -> Matt",
  "Setzen, lachen, verlieren",
  "…und wir gehen rein",
  "Tims Gamblingparadies",
  "Tim Fly ist auch dabei",
  "Und ab geht er der Peter",
  "Der Schornsteinfeger gewinnt!",
  "...ich bin nicht süchtig",
  "Die Gewinne müssen nicht versteuert werden",
  "Wer nicht mitmacht hat schon verloren :(",
  "All in!",
  "Wie hoch ist nochmal mein Dispo?",
  "Hier könnte Ihre Werbung stehen",
  "Vegas für Arme",
  "Gönn doch mal, ey",
  "Auszahlung in Rupien leider nicht möglich",
  "Am Schluss gewinnt niemand",
  "Tim hat einen geheimen Cheatcode",
  "Illegal, aber genial!",
  "Ein Löwe gewinnt immer",
  "Drück die Leiter hoch",
  "Nichts für Weicheier",
  "Freude pur!",
  "Mach hinne!",
  "Das ist ein Safecall",
  "Spaß für einen ganzen Abend",
  "Trust me bro <3",
  "Hier kann man seine Organe verwetten",
  "Höher, schneller, weiter",
  "Cry for me baby",
  "Klassische Loose-Loose-Situation",
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
