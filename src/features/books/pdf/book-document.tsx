import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export interface BookDocumentItem {
  storeName: string;
  storeManager: string | null;
  section: string | null;
  responsibleCompany: string | null;
  coordinatorName: string | null;
  consultantName: string | null;
  code: string | null;
  supplierName: string | null;
  photoUrls: string[];
}

export interface BookDocumentData {
  bookName: string;
  periodLabel: string;
  distributorLogoUrl: string | null;
  industryLogoUrl: string | null;
  industryName: string;
  brandLogoUrls: string[];
  items: BookDocumentItem[];
}

const styles = StyleSheet.create({
  cover: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: 48,
    gap: 24,
  },
  coverLogos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  coverLogo: { height: 64, objectFit: "contain" },
  coverTitle: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  coverPeriod: { fontSize: 16, color: "#475569" },
  coverIndustry: { fontSize: 12, color: "#64748b" },
  page: { padding: 32, fontSize: 10, color: "#0f172a" },
  header: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 8,
    marginBottom: 12,
  },
  storeName: { fontSize: 16, fontWeight: "bold" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  meta: { fontSize: 9, color: "#475569" },
  metaLabel: { color: "#94a3b8" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: {
    width: "31.5%",
    height: 150,
    objectFit: "cover",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 8,
  },
  brandLogo: { height: 28, objectFit: "contain" },
});

function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <Text style={styles.meta}>
      <Text style={styles.metaLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

export function BookDocument({ data }: { data: BookDocumentData }) {
  return (
    <Document title={data.bookName}>
      <Page size="A4" orientation="landscape">
        <View style={styles.cover}>
          <View style={styles.coverLogos}>
            {data.distributorLogoUrl && (
              <Image src={data.distributorLogoUrl} style={styles.coverLogo} />
            )}
            {data.industryLogoUrl && (
              <Image src={data.industryLogoUrl} style={styles.coverLogo} />
            )}
          </View>
          <Text style={styles.coverTitle}>{data.bookName}</Text>
          <Text style={styles.coverPeriod}>{data.periodLabel}</Text>
          <Text style={styles.coverIndustry}>{data.industryName}</Text>
        </View>
      </Page>

      {data.items.map((item, index) => (
        <Page
          key={`${item.storeName}-${index}`}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          <View style={styles.header}>
            <Text style={styles.storeName}>{item.storeName}</Text>
            <View style={styles.metaRow}>
              <Meta label="Seção" value={item.section} />
              <Meta label="Código" value={item.code} />
              <Meta label="Indústria" value={item.supplierName} />
              <Meta label="Empresa PDV" value={item.responsibleCompany} />
              <Meta label="Gerente" value={item.storeManager} />
              <Meta label="Coordenador" value={item.coordinatorName} />
              <Meta label="Consultor" value={item.consultantName} />
            </View>
          </View>

          <View style={styles.grid}>
            {item.photoUrls.map((url, photoIndex) => (
              <Image
                key={`${url}-${photoIndex}`}
                src={url}
                style={styles.photo}
              />
            ))}
          </View>

          {data.brandLogoUrls.length > 0 && (
            <View style={styles.footer} fixed>
              {data.brandLogoUrls.map((url, logoIndex) => (
                <Image
                  key={`${url}-${logoIndex}`}
                  src={url}
                  style={styles.brandLogo}
                />
              ))}
            </View>
          )}
        </Page>
      ))}
    </Document>
  );
}
