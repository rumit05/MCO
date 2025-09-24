// server/data.server.js

// Fetch Shopify Functions
export async function getFunctionId(graphql) {
  const response = await graphql(`
    query {
      shopifyFunctions(first: 50) {
        nodes {
          app { title }
          apiType
          title
          id
        }
      }
    }
  `);
  return response.json(); // returns { data: { shopifyFunctions: { nodes: [...] } } }
}

// Create Bundle Discount
export async function createBundleDiscount(graphql, functionId) {
  const response = await graphql(`
    mutation {
      discountAutomaticAppCreate(automaticAppDiscount: {
        title: "Bundle Discount",
        functionId: "${functionId}",
        startsAt: "2024-10-09T12:00:00Z"
      }) {
        automaticAppDiscount { discountId }
        userErrors { field message }
      }
    }
  `);
  return response.json();
}
