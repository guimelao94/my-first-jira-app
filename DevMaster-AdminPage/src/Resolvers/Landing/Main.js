import { storage, WhereConditions, SortOrder } from '@forge/api';

export const GetStorage = (req) => {

    return 'Landing!';
}

export const CustomStorage = {
      QueryAll: async function(entity) {
        return await storage
        .entity(entity)
        .query()
        .index('ByID');
      },
      Get: function(entity,key) {
        return storage.entity(entity).get(key);
      },
      GetByEpicKey: async function(entity,key) {
        return await storage
        .entity(entity)
        .query()
        .index('ByEpicKey')
        .where(WhereConditions.equalsTo(key))
        .sort(SortOrder.DESC)
        .getMany();
      },
      Save: async function(entity,key){
        try {
            await storage
                .entity(entity)
                .set(key, {
                    EpicKey:"DMA-2",
                    ID: 1
                });
            return "Success";
        } catch (e) {
            return e;
        }
      }

    };

export const Storage = {
    FetchData:async (req) => {
        try {
          const result = await storage
            .query().getMany();
          return result;
        } catch (error) {
          console.error(
            "Error retrieving target project object by target site:",
            error
          );
        }
      },
    GetData: async ({ payload, context }) => {
        try {
          // If context is available and payload.useUserPrefix is true, use user-specific key
          let key = payload.key;
          if (context?.accountId && payload.useUserPrefix) {
            key = `${payload.key}_${context.accountId}`;
          }
          const result = await storage.get(key);
          return result || {};
        } catch (error) {
          console.error(
            "Error retrieving target project object by target site:",
            error
          );
          return {};
        }
      },
    GetData_Internal:(key) => {
        try {
          const result = storage.get(key)
          return result;
        } catch (error) {
          return error;
        }
      },
    SaveData: async ({ payload, context }) => {
        try {
          // If context is available and payload.useUserPrefix is true, use user-specific key
          let key = payload.key;
          if (context?.accountId && payload.useUserPrefix) {
            key = `${payload.key}_${context.accountId}`;
          }
          const result = await storage.set(key, payload.value);
          return result;
        } catch (error) {
          console.error(
            "Error saving target project object:",
            error
          );
          throw error;
        }
      },
      SaveData_Internal:async (key,value) => {
        try {
          const result = await storage
          .set(key, value);
          return result;
        } catch (error) {
          return error;
        }
      }
}