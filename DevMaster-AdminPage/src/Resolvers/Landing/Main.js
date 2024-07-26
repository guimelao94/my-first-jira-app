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
    GetData:(req) => {
        try {
          const result = storage.get(req.payload.key)
          console.log(result);
          return result;
        } catch (error) {
          console.error(
            "Error retrieving target project object by target site:",
            error
          );
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
    SaveData:async (req) => {
        try {
          const result = await storage
          .set(req.payload.key, req.payload.value);
          return result;
        } catch (error) {
          console.error(
            "Error retrieving target project object by target site:",
            error
          );
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