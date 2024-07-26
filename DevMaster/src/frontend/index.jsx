import React from 'react';
import ForgeReconciler, { Text, useProductContext } from '@forge/react';
import { requestJira } from '@forge/bridge';

const App = () => {
  const context = useProductContext();

  // add these code to keep track of comments
  const [comments, setComments] = React.useState();
  console.log(`Number of comments on this issue: ${comments?.length}`);

  const fetchCommentsForIssue = async () => {
    // extract issue ID instead expecting one from function input
    const issueId = context?.extension.issue.id;
  
    // modify to take issueId variable
    const res = await requestJira(`/rest/api/3/issue/${issueId}/comment`);
    const data = await res.json();
    return data.comments;
  };

  React.useEffect(() => {
    if (context) {
      // extract issue ID from the context
      const issueId = context.extension.issue.id;

      fetchCommentsForIssue().then(setComments);
    }
  }, [context]);

  return (
    <>
      <Text>Hello world!</Text>
      <Text>
        Number of comments on this issue: {comments?.length}
      </Text>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
