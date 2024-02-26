const fs = require("fs");

const getVersionSplit = (line) => {
  const versionString = line.substring(4, line.lastIndexOf("]"));
  return versionString.split(".");
};

const createFreshDirectory = (directoryPath) => {
  try {
    if (fs.existsSync(directoryPath)) {
      fs.rmSync(directoryPath+"/*",{ force:true })
    }
    fs.mkdirSync(directoryPath, { recursive: true });
  } catch (err) {
    console.error("Error :", err.message);
  }
};

const splitLog = async() => {
  const data = await fetch("https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-charting/CHANGELOG.md").then(res=>res.text()).catch((err)=>{
    console.error("Fetch error:",err.message)
    throw new Error(err.message)
  });
  const lines = data.split("\n");
  var currentVersion = "";
  var changelogOrder=[]
  var startChop = false;
  var versionToLineMapping = [];
  lines.every((line, index) => {
    if (line.startsWith("<!-- Start content -->")) {
      startChop = true;
    }
    if (startChop) {
      if (line.startsWith("## [")) {
        const versionSplit = getVersionSplit(line);
        if (versionSplit[0] === "5") {
          const minorVersion = versionSplit[0] + "." + versionSplit[1];
          if (currentVersion != minorVersion) {
            currentVersion = minorVersion;
            versionToLineMapping.push({
              version: currentVersion,
              startLine: index,
            });
          }
        } else if (versionSplit[0] === "4") {
          const minorVersion = versionSplit[0] + "." + versionSplit[1];
          if (currentVersion != minorVersion) {
            currentVersion = minorVersion;
            versionToLineMapping.push({
              version: currentVersion,
              startLine: index,
            });
          }
          return false;
        }
      }
    }
    return true;
  });

  createFreshDirectory("dist")

  for (let i = 0; i < versionToLineMapping.length - 1; i++) {
    for(let j=versionToLineMapping[i].startLine;j<versionToLineMapping[i+1].startLine;j++)
    {
        fs.appendFileSync("dist/"+versionToLineMapping[i].version+".md",lines[j]+"\n");
    }
    changelogOrder.push("changelogSplits/"+versionToLineMapping[i].version)
  }
  const changelogJSON={
    "changelogOrder":changelogOrder
  }
  fs.writeFileSync("dist/changelogOrder.json",JSON.stringify(changelogJSON))
};

splitLog();
