const fs = require("fs");
const getVersionSplit = (line) => {
  const versionString = line.substring(4, line.lastIndexOf("]"));
  return versionString.split(".");
};
const splitLog = () => {
  const data = fs.readFileSync("./CHANGELOG.md", "utf8");
  const lines = data.split("\n");
  console.log(lines[5]);
  var currentVersion = "";
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
            // console.log(currentVersion,index)
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
            // console.log(currentVersion,index)
          }
          return false;
        }
      }
    }
    return true;
  });
  for (let i = 0; i < versionToLineMapping.length - 1; i++) {
    for(let j=versionToLineMapping[i].startLine;j<versionToLineMapping[i+1].startLine;j++)
    {
        fs.appendFileSync("dist/"+versionToLineMapping[i].version+".md",lines[j]+"\n");
    }
  }
};
splitLog();
