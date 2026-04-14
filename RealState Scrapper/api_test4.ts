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
          "User-Agent": "Mozilla/5.0",
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
  // searchStays no args gives error. Let's try record arg like GetStay
  const tests = [
    {
      name: "searchStays record",
      query: `query { searchStays(record: {location: "Caracas"}) { items { _id slug title { es } } } }`,
    },
    {
      name: "searchStays record empty",
      query: `query { searchStays(record: {}) { items { _id slug title { es } } } }`,
    },
    {
      name: "searchStays pagination",
      query: `query { searchStays(record: {}, pagination: {limit: 10, page: 1}) { items { _id slug title { es } } total } }`,
    },
    {
      name: "searchStays items fields",
      query: `query { searchStays { items { _id slug } total page pages } }`,
    },
    {
      name: "GetStay full fields",
      query: `query { getStay(record: {slug: "17281517903060393862"}) { _id slug title { es } description { es } address city state country latitude longitude pricePerNight maxGuests bedrooms bathrooms beds amenities { name } host { name email } images { url alt } } }`,
    },
  ];

  for (const t of tests) {
    console.log(`\n=== ${t.name} ===`);
    const r = await gqlRequest({ query: t.query, variables: t.variables });
    const str = JSON.stringify(r);
    console.log(str.slice(0, 3000));
  }
})().catch(console.error);
