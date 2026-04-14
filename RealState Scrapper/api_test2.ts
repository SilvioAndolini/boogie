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
          try { resolve(JSON.parse(body)); } catch { resolve({ raw: body.slice(0, 5000) }); }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  // The error told us: searchStays exists, SearchStaysType is the return type
  // Try different argument patterns
  const tests = [
    {
      name: "searchStays no args",
      query: `query { searchStays { stays { id slug title } } }`,
    },
    {
      name: "searchStays with input",
      query: `query { searchStays(input: {location: "Caracas"}) { stays { id slug title } } }`,
    },
    {
      name: "searchStays empty",
      query: `query { searchStays { id slug title } }`,
    },
    {
      name: "GetStay with query",
      query: `query GetStay($slug: String!) { getStay(slug: $slug) { id slug title description } }`,
      variables: { slug: "17281517903060393862" },
    },
    {
      name: "GetStay by id",
      query: `query { getStay(id: "17281517903060393862") { id slug title } }`,
    },
    {
      name: "stays list",
      query: `query { stays { id slug title } }`,
    },
    {
      name: "allStays",
      query: `query { allStays { id slug title } }`,
    },
    {
      name: "getStays",
      query: `query { getStays { id slug title } }`,
    },
  ];

  for (const t of tests) {
    console.log(`\n=== ${t.name} ===`);
    const r = await gqlRequest({ query: t.query, variables: t.variables });
    const str = JSON.stringify(r);
    console.log(str.slice(0, 2000));
  }
})().catch(console.error);
