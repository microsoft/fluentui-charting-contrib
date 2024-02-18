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
      if (["major", "minor", "patch"].some((key) => key in item.comments)) {
        fs.appendFileSync(
          minorVersion + ".md",
          `\n## [${item.version}](https://github.com/microsoft/fluentui/tree/@fluentui/react-charting_v${item.version})\n\n`,
          throwError
        );
        fs.appendFileSync(
          minorVersion + ".md",
          `\n${item.date}\n[Compare Changes](https://github.com/microsoft/fluentui/compare/@fluentui/react-charting_v${data.entries[index+1].tag}..@fluentui/react-charting_v${item.version})\n`,
          throwError
        );
      }
      if ("major" in item.comments) {
        fs.appendFileSync(
          minorVersion + ".md",
          "\n### Major Changes\n\n",
          throwError
        );
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
        fs.appendFileSync(
          minorVersion + ".md",
          "\n### Minor Changes\n\n",
          throwError
        );
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
        fs.appendFileSync(minorVersion + ".md", "\n### Patches\n\n", throwError);
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
