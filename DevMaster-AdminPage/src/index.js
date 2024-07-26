import Resolver from '@forge/resolver';
import { Sidebar_GetHeading } from './Resolvers/Sidebar/Main';
import { CustomStorage, Storage } from './Resolvers/Landing/Main';
import { storage, WhereConditions, SortOrder } from '@forge/api';
import { Issue } from './Resolvers/Common/Issue';

const resolver = new Resolver();

resolver.define('getSidebarHeading', Sidebar_GetHeading);

resolver.define('CustomStorage.Save', CustomStorage.Save);
resolver.define('CustomStorage.QueryAll', CustomStorage.QueryAll);
resolver.define('CustomStorage.Get', CustomStorage.Get);

resolver.define("Storage.FetchData", Storage.FetchData);

resolver.define("Storage.GetData", Storage.GetData);

resolver.define("Storage.SaveData", Storage.SaveData);

resolver.define("Issue.Generate", Issue.GenerateIssueData);

resolver.define('Storage.GetData2', async ({ payload, context }) => {
    try {
        const result = await storage.get(payload.key)
        return result;
      } catch (error) {
        console.error(
          "Error retrieving target project object by target site:",
          error
        );
      }
  });

export const handler = resolver.getDefinitions();

