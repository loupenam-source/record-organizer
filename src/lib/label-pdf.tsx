import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { RecordRow, TrackRow } from "./db";

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#111",
  },
  header: {
    borderBottom: "1pt solid #111",
    paddingBottom: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
    marginLeft: 6,
  },
  artist: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  album: {
    fontSize: 12,
    marginTop: 2,
  },
  year: {
    fontSize: 10,
    color: "#555",
    marginTop: 2,
  },
  sideHeader: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 3,
    backgroundColor: "#eee",
    padding: 2,
  },
  track: {
    marginBottom: 5,
  },
  trackTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  trackMeta: {
    fontSize: 10,
    color: "#444",
    marginTop: 1,
  },
  trackDesc: {
    fontSize: 10,
    marginTop: 1,
    fontStyle: "italic",
  },
});

const PT_PER_INCH = 72;
const PAGE = { width: 4 * PT_PER_INCH, height: 6 * PT_PER_INCH };

export function LabelDocument({
  record,
  tracks,
  logo,
}: {
  record: RecordRow;
  tracks: TrackRow[];
  logo?: Buffer;
}) {
  const sideA = tracks.filter((t) => t.side === "A");
  const sideB = tracks.filter((t) => t.side === "B");

  return (
    <Document>
      <Page size={PAGE} style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.artist}>{record.artist}</Text>
            <Text style={styles.album}>{record.album}</Text>
            {record.year ? <Text style={styles.year}>{record.year}</Text> : null}
          </View>
          {logo ? <Image src={logo} style={styles.logo} /> : null}
        </View>

        {sideA.length > 0 && (
          <>
            <Text style={styles.sideHeader}>SIDE A</Text>
            {sideA.map((t) => (
              <TrackBlock key={t.id} track={t} />
            ))}
          </>
        )}

        {sideB.length > 0 && (
          <>
            <Text style={styles.sideHeader}>SIDE B</Text>
            {sideB.map((t) => (
              <TrackBlock key={t.id} track={t} />
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

function TrackBlock({ track }: { track: TrackRow }) {
  const metaParts: string[] = [];
  if (track.genre) metaParts.push(track.genre);
  metaParts.push(track.vocals ? "vocals" : "instrumental");
  if (track.when_to_play) metaParts.push(track.when_to_play);

  return (
    <View style={styles.track}>
      <Text style={styles.trackTitle}>
        {track.side}
        {track.position}  {track.title}
      </Text>
      <Text style={styles.trackMeta}>{metaParts.join("  ·  ")}</Text>
      {track.description ? (
        <Text style={styles.trackDesc}>{track.description}</Text>
      ) : null}
    </View>
  );
}
