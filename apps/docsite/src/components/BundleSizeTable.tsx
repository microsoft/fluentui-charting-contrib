import React, { useEffect, useState } from "react";
type MonosizeJSON = {
  name: string;
  path: string;
  minifiedSize: number;
  gzippedSize: number;
};
const BundleSizeTable = () => {
  const [bundleSizeData, setBundleSizeData] = useState<
    MonosizeJSON[] | undefined
  >(undefined);
  const [errorState, setErrorState] = useState<Error | undefined>();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/microsoft/fluentui-charting-contrib/test-coverage-artifacts/bundle-size/monosize.json",
          { mode: "cors" }
        )
        if (!response) {
          throw new Error("Invalid response");
        }
        const data = await response.json();
        setBundleSizeData(data);
      } catch (error) {
        setErrorState(error);
      }
    };
    fetchData();
  }, []);
  if (errorState) {
    return <h3>Error: {errorState.message}</h3>;
  }
  return (
    <>
      {bundleSizeData ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>MIN size</th>
              <th>GZIP size</th>
            </tr>
          </thead>
          <tbody>
            {bundleSizeData.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{(item.minifiedSize / 1024).toFixed(2)} KiB</td>
                <td>{(item.gzippedSize / 1024).toFixed(2)} KiB</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <h4>Loading...</h4>
      )}
    </>
  );
};

export default BundleSizeTable;
