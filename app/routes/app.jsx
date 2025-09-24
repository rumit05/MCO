// app/root.jsx
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { createBundleDiscount, getFunctionId } from "../server/data.server";

// Load Polaris CSS
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Loader
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch all Shopify Functions to get the correct functionId
  const functionData = await getFunctionId(admin.graphql);
  const functionNode = functionData?.data?.shopifyFunctions?.nodes?.[0]; // take first for example
  const functionId = "019975bf-d3b8-7de9-886a-a573a4221ccc"; // fallback to hardcoded if missing

  // Create or fetch the bundle discount
  const bundleDiscountResult = await createBundleDiscount(admin.graphql, functionId);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    bundleDiscount: bundleDiscountResult,
  };
};

// Main App Component
export default function App() {
  const { apiKey, bundleDiscount } = useLoaderData();

  console.log("Bundle Discount Result:", bundleDiscount);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Error Boundary
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

// Shopify Headers
export const headers = (headersArgs) => boundary.headers(headersArgs);
