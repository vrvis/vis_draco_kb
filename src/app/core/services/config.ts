import { DBConfig } from "ngx-indexed-db";

export const dbConfig: DBConfig  = {
    name: 'knowledgebase',
    version: 1,
    objectStoresMeta: [{
      store: 'soft',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: true } }
      ]
    },
    {
      store: 'hard',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: true } }
      ]
    },
    {
      store: 'features',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: true } }
      ]
    },
    {
      store: 'hierarchies',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: true } },
        { name: 'constraintType', keypath: 'constraintType', options: { unique: false } },
        { name: 'featureType', keypath: 'featureType', options: { unique: false } }
      ]
    },
    {
      store: 'hyperlinks',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: true } },
        { name: 'constraintType', keypath: 'constraintType', options: { unique: false } },
        { name: 'featureType', keypath: 'featureType', options: { unique: false } }
      ]
    }]
  };