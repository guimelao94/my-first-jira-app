import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
const resolver = new Resolver();

resolver.define('fetchLabels', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}?fields=labels`);

  const data = await res.json();

  console.warn(req.context.extension.issue);
  const label = data.fields.labels;
  if (label == undefined) {
    console.warn(`${key}: Failed to find labels`);
    return [];
  }

  return label;
});

resolver.define('fetchContext', async (req) => {
  return req;
});

export const handler = resolver.getDefinitions();
