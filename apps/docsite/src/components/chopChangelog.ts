const fs = require("fs");
const getVersionSplit=(line)=>{
    const versionString=line.substring(4,line.lastIndexOf(']'))
    return versionString.split('.');
}
const splitLog=()=>{
    const data=fs.readFileSync("./CHANGELOG.md",'utf8')
    const lines=data.split('\n');
    console.log(lines[5])
    var currentVersion="";
    var startChop=false
    lines.forEach((line,index) => {
        if(line.startsWith("<!-- Start content -->"))
        {
            startChop=true
        }
        if(startChop){

            if(line.startsWith("## ["))
            {
                // console.log(line)
                const versionSplit=getVersionSplit(line)
                if(versionSplit[0]==='5'){
                    const minorVersion=versionSplit[0]+'.'+versionSplit[1];
                    if(currentVersion!=minorVersion)
                    {
                        currentVersion=minorVersion
                        console.log(currentVersion,index)
                    }
                }
            }
        }
    });

}
splitLog();