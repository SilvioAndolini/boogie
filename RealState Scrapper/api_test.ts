import * as https from "https";

function gqlRequest(body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "api.estei.app",
        path: "/graphql",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
          Origin: "https://estei.app",
          Referer: "https://estei.app/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ raw: body.slice(0, 2000) });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  // Test 1: GetStay with known ID
  console.log("=== Test 1: GetStay ===");
  const r1 = await gqlRequest({
    operationName: "GetStay",
    variables: { record: { preview: "undefined", slug: "17281517903060393862", useCase: "bookingPreview" } },
    extensions: {
      persistedQuery: { version: 1, sha256Hash: "dfe04666d3fdd01ebd0208cb658c330c130337164c8ce87bed44f64a55ff6d5e" },
    },
  });
  console.log(JSON.stringify(r1).slice(0, 2000));

  // Test 2: Try to search stays
  console.log("\n=== Test 2: SearchStays ===");
  const r2 = await gqlRequest({
    operationName: "SearchStays",
    variables: {
      record: {
        location: "Caracas",
        guests: 1,
        arrivalDate: "2026-04-14",
        departureDate: "2026-04-15",
      },
    },
  });
  console.log(JSON.stringify(r2).slice(0, 2000));

  // Test 3: Try Stays query
  console.log("\n=== Test 3: Stays ===");
  const r3 = await gqlRequest({
    operationName: "Stays",
    variables: { record: { limit: 10, offset: 0 } },
  });
  console.log(JSON.stringify(r3).slice(0, 2000));

  // Test 4: Try full query text
  console.log("\n=== Test 4: Direct query ===");
  const r4 = await gqlRequest({
    query: `query SearchStays($record: SearchStaysInput!) { searchStays(record: $record) { id slug title } }`,
    variables: {
      record: {
        location: "Caracas",
        guests: 1,
        arrivalDate: "2026-04-14",
        departureDate: "2026-04-15",
      },
    },
  });
  console.log(JSON.stringify(r4).slice(0, 2000));

  // Test 5: Introspection
  console.log("\n=== Test 5: Introspection ===");
  const r5 = await gqlRequest({
    query: `{ __schema { queryType { name fields { name args { name type { name } } } } } }`,
  });
  console.log(JSON.stringify(r5).slice(0, 3000));
})().catch(console.error);
