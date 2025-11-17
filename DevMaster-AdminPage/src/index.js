import Resolver from '@forge/resolver';
import { Sidebar_GetHeading } from './Resolvers/Sidebar/Main';
import { CustomStorage, Storage } from './Resolvers/Landing/Main';
import { storage, WhereConditions, SortOrder } from '@forge/api';
import { Issue } from './Resolvers/Common/Issue';
import { UserContext } from './Resolvers/User/UserContext';
import { Bootstrap } from './Resolvers/User/Bootstrap';

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

// User context resolvers
resolver.define('User.GetCurrentUser', UserContext.getCurrentUser);
resolver.define('User.GetUserRole', UserContext.getUserRole);
resolver.define('User.SetUserRole', UserContext.setUserRole);
resolver.define('User.GetAllUsers', UserContext.getAllUsers);
resolver.define('User.GetAllUserRoles', async ({ payload, context }) => {
    return await UserContext.getAllUserRoles({ context });
});
resolver.define('User.RebuildUserRolesRegistry', async ({ payload, context }) => {
    return await UserContext.rebuildUserRolesRegistry({ payload, context });
});

// Bootstrap resolvers
resolver.define('Bootstrap.InitializeAdmin', async ({ payload, context }) => {
    // Use accountId from payload if provided, otherwise from context
    const accountId = payload?.accountId || context?.accountId;
    return await Bootstrap.initializeAdmin(accountId);
});
resolver.define('Bootstrap.HasAdmin', async () => {
    return await Bootstrap.hasAdmin();
});
resolver.define('Bootstrap.GetInfo', async () => {
    return await Bootstrap.getBootstrapInfo();
});

export const handler = resolver.getDefinitions();

