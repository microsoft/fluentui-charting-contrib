import React, { useEffect, useState } from 'react'

const BundleSizeTable = () => {
    const [bundleSizeData, setBundleSizeData] = useState();
    const createTableFromJSON = (JSONData) =>{
        
    }
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("https://raw.githubusercontent.com/microsoft/fluentui-charting-contrib/test-coverage-artifacts/windowsCoverage.json");
                if (!response) {
                    throw new Error('Invalid response');
                }
                const data = await response.json();
                setBundleSizeData(data);
            } catch (error) {
                console.error("Error while fetching:", error);
            }
        }
        fetchData();
    }, []);
    return (
        <>
            {JSON.stringify(bundleSizeData)}
        </>
    )
}

export default BundleSizeTable