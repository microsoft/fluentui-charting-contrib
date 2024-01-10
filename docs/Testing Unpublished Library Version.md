You may want to test changes made to the library in an app locally. This becomes useful to validate a fix or root cause an issue occuring only in a specific app or context. 
Or someone may want to demo a cool new feature in real app context before the changes are tested and published.
There are a few ways to test unpublished versions:
- If the library and app are being developed on the same devbox, follow https://github.com/microsoft/fluentui/wiki/Using-local-(unpublished)-version-of-the-lib-with-a-local-React-app

- Otherwise, create a private package of the library and replace the published version with it in the app. Follow below steps:
1. Checkout a codespace. Go to  `https://github.com/codespaces/new`, select the `microsoft\fluentui` repo and your working branch.
2. Go to the `packages\react-charting` path which contains the local changes.
3. Run `yarn build`
4. Run `yarn pack`. This will generate a tgz file (for eg`fluentui-react-charting-v5.16.13.tgz`).
5. Copy the tgz file to the app devbox.
6. Go to the app and run `npm install <path to tgz file>` or `yarn install <path to tgz file>` depending upon the package manager of your app.
7. Install any additional package dependencies that are introduced.