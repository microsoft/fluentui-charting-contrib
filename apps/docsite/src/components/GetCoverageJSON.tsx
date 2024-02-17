import React, { useEffect, useState } from "react";

interface GetCoverageJSONProps {
  OS: string;
}
const GetCoverageJSON: React.FC<GetCoverageJSONProps> = ({ OS }) => {
  const [coverage, setCoverage] = useState<number | undefined>();
  const [errorState, setErrorState] = useState<Error | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetch(
          `https://raw.githubusercontent.com/microsoft/fluentui-charting-contrib/test-coverage-artifacts/${OS.toLowerCase()}Coverage.json`,
          { mode: "cors" }
        ).then((res) => res.json());
        if (!data) {
          throw new Error("Invalid response");
        }
        setCoverage(data.statementCoverage);
      } catch (error) {
        setErrorState(error);
      }
    };
    fetchData();
  }, []);

  if (errorState) {
    return (
      <img
        src={`https://img.shields.io/badge/Error-fetching-red`}
        alt="Test Coverage Badge"
      />
    );
  }
  return (
    <div>
      {coverage && (
        <img
          src={`https://img.shields.io/badge/${OS}-${coverage}-darkgreen`}
          alt="Test Coverage Badge"
        />
      )}
    </div>
  );
};

export default GetCoverageJSON;
