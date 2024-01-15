This page will help you get familiar with the react charting controls, how the code and documents are organized.

Follow [fluent setup](https://github.com/microsoft/fluentui/wiki/Setup#basic-setup) guide to get started.

**Folder structure.**
The charting library is located within `package/react-charting`.

The source code is located in the `src/` directory.
`src/components` contains implementation for individual charts in the folder.
`src/components/CommonComponents` contains implementation for CartesianChart which is a common component for all axis based charts. 

Design documentation and RFCs for some recent functionalities is located in the `docs/` folder.

Test files are colocated along with the implementation files and end with `.test.tsx`.

Details about each chart component is covered in later pages within each component section.