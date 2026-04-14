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
  // 1. SearchStays - has 'items', no 'input' arg, need to find right args
  const tests = [
    {
      name: "searchStays with items",
      query: `query { searchStays { items { _id slug title { es } } } }`,
    },
    {
      name: "getStay with record",
      query: `query { getStay(record: {slug: "17281517903060393862"}) { _id slug title { es } description { es } } }`,
    },
    {
      name: "stay query",
      query: `query { stay { _id slug title { es } } }`,
    },
    {
      name: "searchStays location arg",
      query: `query { searchStays(location: "Caracas") { items { _id slug title { es } } } }`,
    },
    {
      name: "searchStays filter arg",
      query: `query { searchStays(filter: {location: "Caracas"}) { items { _id slug title { es } } } }`,
    },
  ];

  for (const t of tests) {
    console.log(`\n=== ${t.name} ===`);
    const r = await gqlRequest({ query: t.query, variables: t.variables });
    const str = JSON.stringify(r);
    console.log(str.slice(0, 3000));
  }
})().catch(console.error);
