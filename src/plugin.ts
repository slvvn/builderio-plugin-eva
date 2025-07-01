import {
  registerCommercePlugin,
  CommerceAPIOperations,
} from "@builder.io/commerce-plugin-tools";
import { getDataConfig } from "./data-plugin";
import appState from "@builder.io/app-context";

interface EvaProduct {
  product_id: string;
  display_value?: string;
  display_price?: number;
  primary_image?: {
    blob?: string;
    url?: string;
  };
}

interface EvaSearchResponse {
  Products: EvaProduct[];
}

interface Resource {
  id: string;
  title: string;
  handle?: string;
  image?: {
    src: string;
  };
}

const plugin = registerCommercePlugin(
  {
    name: "EVA",
    id: "@builder.io/plugin-eva",
    settings: [
      {
        name: "organizationUnitSetID",
        type: "string",
        required: false,
        helperText: "Enter your EVA Organization Unit Set ID",
      },
    ],
    ctaText: "Connect EVA",
  },
  (settings) => {
    // Basic cache for better UX
    const cache = new Map<string, Resource>();

    const baseUrl = (endpoint: string) => {
      return `https://api.newblack.guc.prod.eva-online.global/message/${endpoint}`;
    };

    const headers = {
      "Content-Type": "application/json",
      "Eva-User-Agent": "Eva-Builder-Plugin",
      "Eva-Requested-OrganizationUnitID": settings.get("organizationUnitSetID"),
    };

    const searchProducts = async (searchTerm?: string): Promise<Resource[]> => {
      try {
        const response = await fetch(baseUrl("SearchProducts"), {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...(searchTerm && { Query: searchTerm }),
            PageConfig: {
              PageSize: 20,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Eva API error: ${response.statusText}`);
        }

        const data: EvaSearchResponse = await response.json();
        return data.Products.map((product) => ({
          id: product.product_id,
          handle: product.product_id,
          title: product.display_value ?? "",
          image: product.primary_image?.url
            ? {
                src: product.primary_image.url,
              }
            : undefined,
        }));
      } catch (error) {
        console.error("Error fetching Eva products", error);
        return [];
      }
    };

    const getProductDetail = async (id: string): Promise<Resource> => {
      const response = await fetch(baseUrl("GetProductDetail"), {
        method: "POST",
        headers,
        body: JSON.stringify({ ID: id }),
      });

      const data = await response.json();
      if (!data.Result) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return {
        id: data.Result.product_id,
        handle: data.Result.product_id,
        title: data.Result.display_value,
        image: data.Result.primary_image?.url
          ? {
              src: data.Result.primary_image.url,
            }
          : undefined,
      };
    };

    const service: CommerceAPIOperations = {
      product: {
        async findById(id: string): Promise<Resource> {
          const cacheKey = `product-${id}`;
          if (cache.has(cacheKey)) {
            return cache.get(cacheKey)!;
          }

          const product = await getProductDetail(id);

          if (!product) {
            throw new Error(`Product with ID ${id} not found`);
          }

          cache.set(cacheKey, product);
          return product;
        },

        async findByHandle(handle: string): Promise<Resource> {
          const cacheKey = `product-handle-${handle}`;
          if (cache.has(cacheKey)) {
            return cache.get(cacheKey)!;
          }

          const product = await getProductDetail(handle);

          if (!product) {
            throw new Error(`Product with ID ${handle} not found`);
          }

          cache.set(cacheKey, product);
          return product;
        },

        async search(search: string): Promise<Resource[]> {
          const products = await searchProducts(search);
          return products;
        },

        getRequestObject(id: string) {
          return {
            "@type": "@builder.io/core:Request" as const,
            request: {
              url: baseUrl("GetProductDetail"),
              method: "POST",
              headers,
              body: JSON.stringify({
                Filter: {
                  ProductID: id,
                },
                PageConfig: {},
              }),
            },
            options: {
              product: id,
            },
          };
        },
      },
    };

    const dataConfig = getDataConfig(service, {
      organizationUnitSetID: settings.get("organizationUnitSetID"),
    });
    appState.registerDataPlugin(dataConfig);

    return service;
  }
);

export default plugin;
