import type { ResourceType } from "@builder.io/sdk";
import { CommerceAPIOperations } from "@builder.io/commerce-plugin-tools";

type EvaResourceType = "product";

interface EvaUrlParams {
  resource: EvaResourceType;
  resourceId?: string;
}

const buildHeaders = (headers: {
  organizationUnitSetID: string;
  [key: string]: any;
}) => ({
  "Content-Type": "application/json",
  "Eva-User-Agent": "Eva-Builder-Plugin",
  "Eva-Requested-Organization-ID": headers.organizationUnitSetID,
});

function buildEvaUrl({ resource, resourceId }: EvaUrlParams): string {
  const base = "https://api.newblack.guc.prod.eva-online.global/message";
  let endpoint = "";

  switch (resource) {
    case "product":
      endpoint = resourceId ? "GetProductDetail" : "SearchProducts";
      break;
    default:
      throw new Error(`Unsupported resource type: ${resource}`);
  }

  return `${base}/${endpoint}`;
}

const RESOURCE_TYPES: {
  name: string;
  id: EvaResourceType;
  description: string;
}[] = [
  {
    name: "Product",
    id: "product",
    description: "All of your EVA products.",
  },
];

interface DataPluginConfig {
  name: string;
  icon: string;
  getResourceTypes: () => Promise<ResourceType[]>;
  getEntriesByResourceType: (
    resourceTypeId: string,
    options: any
  ) => Promise<Array<{ id: string; name: string }>>;
}

export const getDataConfig = (
  service: CommerceAPIOperations,
  headers: any
): DataPluginConfig => {
  return {
    name: "EVA",
    icon: "https://avatars.githubusercontent.com/u/14044098?s=200&v=4",
    getResourceTypes: async () =>
      RESOURCE_TYPES.map(
        (model): ResourceType => ({
          ...model,
          entryInputs: () => [
            {
              friendlyName: "Search",
              name: "query",
              type: "string",
            },
          ],
          inputs: () => [
            {
              friendlyName: "limit",
              name: "limit",
              type: "number",
              defaultValue: 10,
              max: 100,
              min: 1,
            },
            {
              friendlyName: "Search",
              name: "query",
              type: "string",
            },
          ],

          toUrl: ({
            entry,
            query,
            limit,
          }: {
            entry?: string;
            query?: string;
            limit?: number;
          }) => {
            const url = buildEvaUrl({
              resource: model.id,
              resourceId: entry,
            });

            return {
              "@type": "@builder.io/core:Request",
              request: {
                url,
                method: "POST",
                headers: buildHeaders(headers),
                body: JSON.stringify(
                  entry
                    ? {
                        ID: entry,
                      }
                    : {
                        ...(query && { Query: query }),
                        PageConfig: {
                          ...(limit && { PageSize: limit }),
                        },
                      }
                ),
              },
            };
          },
          canPickEntries: true,
        })
      ),
    getEntriesByResourceType: async (resourceTypeId, options = {}) => {
      const entry = options.resourceEntryId;
      if (entry) {
        const entryObj = await service[resourceTypeId].findById(entry);

        return [
          {
            id: String(entryObj.id),
            name: entryObj.title,
          },
        ];
      }

      const response = await service[resourceTypeId].search(
        options.searchText || ""
      );
      return response.map((result) => ({
        id: String(result.id),
        name: result.title,
      }));
    },
  };
};
