const fs = require("fs");
function throwError(err) {
  if (err) throw err;
}
const fetchChangelog = async () => {
  const data = await fetch(
    "https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-charting/CHANGELOG.json"
  ).then((res) => res.json());
  data.entries.map((item, index) => {
    if (item.tag.startsWith("@fluentui/react-charting")) {
      let versionSplit = item.version.split(".");
      console.log(versionSplit);
      const minorVersion = versionSplit[0] + "." + versionSplit[1];
      if ("major" in item.comments) {
        fs.appendFileSync(minorVersion + ".md", "### Major Changes\n\n", throwError);
        item.comments.major.map((majorItem, majorIndex) => {
          fs.appendFileSync(
            minorVersion + ".md",
            "- " + majorItem.comment + "\n",
            throwError
          );
        });
        fs.appendFileSync(minorVersion + ".md", "\n", throwError);
      }
      if ("minor" in item.comments) {
        fs.appendFileSync(minorVersion + ".md", "### Minor Changes\n\n", throwError);
        item.comments.minor.map((minorItem, minorIndex) => {
          fs.appendFileSync(
            minorVersion + ".md",
            "- " + minorItem.comment + "\n",
            throwError
          );
        });
        fs.appendFileSync(minorVersion + ".md", "\n", throwError);
      }
      if ("patch" in item.comments) {
        fs.appendFileSync(minorVersion + ".md", "### Patches\n\n", throwError);
        item.comments.patch.map((patchItem, patchIndex) => {
          fs.appendFileSync(
            minorVersion + ".md",
            "- " + patchItem.comment + "\n",
            throwError
          );
        });
        fs.appendFileSync(minorVersion + ".md", "\n", throwError);
      }
      // if("none" in item.comments){
      //   item.comments.none.map((noneItem,noneIndex)=>{
      //     fs.appendFile(minorVersion+".md","- "+noneItem.comment+"\n",(err)=>{
      //       if(err) throw err;
      //     });
      //   })
      // }
    }
  });
};
fetchChangelog();
