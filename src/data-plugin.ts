import type { ResourceType } from '@builder.io/sdk';
import { CommerceAPIOperations } from '@builder.io/commerce-plugin-tools';

type EvaResourceType = 'product';

interface EvaUrlParams {
  resource: EvaResourceType;
  resourceId?: string;
  query?: string;
  limit?: number;
  headers: {
    organizationUnitSetID: string;
    [key: string]: any;
  };
}

const buildHeaders = (headers: { organizationUnitSetID: string; [key: string]: any }) => ({
  'Content-Type': 'application/json',
  'Eva-User-Agent': 'Eva-Builder-Plugin',
  'Eva-Requested-Organization-ID': headers.organizationUnitSetID,
});

function buildEvaUrl({ resource, resourceId, query, limit, headers }: EvaUrlParams): string {
  const base = 'https://api.newblack.guc.prod.eva-online.global/message';
  let endpoint = '';

  switch (resource) {
    case 'product':
      endpoint = resourceId ? 'GetProductDetail' : 'SearchProducts';
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
    name: 'Product',
    id: 'product',
    description: 'All of your Eva products.',
  },
];

interface DataPluginConfig {
  name: string;
  icon: string;
  getResourceTypes: () => Promise<ResourceType[]>;
  getEntriesByResourceType: (resourceTypeId: string, options: any) => Promise<Array<{ id: string; name: string }>>;
}

export const getDataConfig = (service: CommerceAPIOperations, headers: any): DataPluginConfig => {
  return {
    name: 'Eva Commerce',
    icon: 'https://example.com/eva-logo.png', // TODO: Replace with actual Eva logo URL
    getResourceTypes: async () =>
      RESOURCE_TYPES.map(
        (model): ResourceType => ({
          ...model,
          inputs: () => [
            {
              friendlyName: 'limit',
              name: 'limit',
              type: 'number',
              defaultValue: 10,
              max: 100,
              min: 1,
            },
            {
              friendlyName: 'Search',
              name: 'query',
              type: 'string',
            },
          ],

          toUrl: ({ entry, query, limit }: { entry?: string; query?: string; limit?: number }) => {
            const url = buildEvaUrl({
              query,
              limit,
              resource: model.id,
              resourceId: entry,
              headers,
            });

            // Return a Builder.io Request object
            return {
              '@type': '@builder.io/core:Request',
              request: {
                url,
                method: 'POST',
                headers: buildHeaders(headers),
                body: JSON.stringify(
                  entry
                    ? {
                        ID: entry,
                      }
                    : {
                        Filter: {
                          ...(query && { SearchTerm: query }),
                        },
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
      // Fetch entries from Eva using the provided service
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

      const response = await service[resourceTypeId].search(options.searchText || '');
      return response.map(result => ({
        id: String(result.id),
        name: result.title,
      }));
    },
  };
};
