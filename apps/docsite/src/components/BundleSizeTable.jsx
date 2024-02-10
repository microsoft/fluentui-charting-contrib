import React, { useEffect, useState } from 'react'

const BundleSizeTable = () => {
    const [bundleSizeData, setBundleSizeData] = useState();
    const [bundleSizeTable, setBundleSizeTable] = useState();
    const createTableFromJSON = (JSONData) => {
        JSONData.map((item, index) => {
            console.log(item)
        })
    }
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("https://raw.githubusercontent.com/Shubhabrata08/fluentui/add-monosize-measure-json/packages/react-charting/monosize.json");
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
    useEffect(() => {
        if (bundleSizeData) {
            createTableFromJSON(bundleSizeData)
        }
    }, [bundleSizeData])
    return (
        <>
            {bundleSizeData? (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>MIN size</th>
                            <th>GZIP size</th>
                            {/* Add more headings if needed */}
                        </tr>
                    </thead>
                    <tbody>
                        {bundleSizeData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td> 
                                <td>{((item.minifiedSize)/1024).toFixed(2)} KiB</td> 
                                <td>{((item.gzippedSize)/1024).toFixed(2)} KiB</td> 
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Loading...</p>
            )}
        </>
    )
}

export default BundleSizeTable