Hobbyprojekt um Gruppenreisen zu vereinfachen.
Jetzt muss man nicht mehr ein gemeinsames Splitwise einrichten, Fotos in WhatsApp verschicken oder ein Google Sheet anlegen.
Diese Seite soll alles drei ersetzen.

# Trip Planner

Eine Webanwendung zur gemeinsamen Planung von Reisen.
Man kann Reisen erstellen, Teilnehmer einladen, Ausgaben verwalten, Buchungen hinzufügen, Fotos hochladen und Notizen teilen.

## Features

- **Reisen erstellen** – Lege neue Reisen mit Namen, Beschreibung und Zeitraum an
- **Teilnehmer einladen** – Füge Reiseteilnehmer hinzu und teile Reisen über einen Share-Code
- **Ausgabenverwaltung** – Erfasse Ausgaben, verteile Kosten auf mehrere Personen und behalte den Überblick
- **Buchungen** – Verwalte Unterkünfte, Transportmittel und andere Reservierungen
- **Fotogalerie** – Lade Fotos hoch und teile Erinnerungen mit der Gruppe
- **Notizen** – Sammle wichtige Informationen und To-dos für die Reise
- **Zahlungen** – Dokumentiere Ausgleichszahlungen zwischen Teilnehmern

## Tech-Stack

| Technologie                                   | Verwendung                        |
| --------------------------------------------- | --------------------------------- |
| [Next.js 16](https://nextjs.org/)             | Full-Stack Framework (App Router) |
| [React 19](https://react.dev/)                | UI-Bibliothek                     |
| [TypeScript](https://www.typescriptlang.org/) | Typsicherheit                     |
| [Prisma](https://www.prisma.io/)              | Datenbank-ORM                     |
| [PostgreSQL](https://www.postgresql.org/)     | Datenbank                         |
| [Tailwind CSS 4](https://tailwindcss.com/)    | Styling                           |
| [Lucide React](https://lucide.dev/)           | Icons                             |

## Voraussetzungen

- Node.js 18+
- PostgreSQL-Datenbank
- npm oder ein anderer Paketmanager

## Installation

1. Repository klonen:

```bash
git clone <repository-url>
cd trip-planner
```

2. Abhängigkeiten installieren:

```bash
npm install
```

3. Umgebungsvariablen konfigurieren:

```bash
cp .env.example .env
```

Bearbeite die `.env`-Datei und passe die Werte an:

```env
DATABASE_URL="postgresql://benutzer:passwort@localhost:5432/tripplanner?schema=public"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

4. Datenbank-Schema anwenden:

```bash
npx prisma db push
```

5. Entwicklungsserver starten:

```bash
npm run dev
```

Die Anwendung ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Verfügbare Skripte

| Befehl                | Beschreibung                        |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Entwicklungsserver starten          |
| `npm run build`       | Produktions-Build erstellen         |
| `npm run start`       | Produktionsserver starten           |
| `npm run lint`        | Linter ausführen                    |
| `npx prisma db push`  | Datenbank-Schema synchronisieren    |
| `npx prisma generate` | Prisma Client generieren            |
| `npx prisma studio`   | Prisma Studio öffnen (Datenbank-UI) |

## Projektstruktur

```
trip-planner/
├── app/                  # Next.js App Router (Seiten & API)
│   ├── api/              # API-Routen
│   ├── join/             # Reise beitreten
│   └── trip/[tripId]/    # Reise-Detailseiten
├── components/           # React-Komponenten
├── prisma/               # Datenbank-Schema
├── generated/            # Prisma Client (generiert)
├── lib/                  # Hilfsfunktionen
└── public/               # Statische Assets
```

## Datenbank-Modell

Die Anwendung nutzt folgende Hauptentitäten:

- **Trip** – Eine Reise mit Name, Zeitraum und Share-Code
- **Member** – Teilnehmer einer Reise
- **Expense** – Ausgaben mit Aufteilung auf Teilnehmer
- **Booking** – Buchungen (Unterkünfte, Transport, etc.)
- **Photo** – Fotos zur Reise
- **Payment** – Ausgleichszahlungen zwischen Teilnehmern

## ToDo:

- implement loading animation on creating
- localization issue with time and dates in booking section
- load photos source faster
