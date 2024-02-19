const fs = require("fs");
function throwError(err) {
  if (err) throw err;
}

const fetchPRNumber = async (commitHash) => {
  const data = await fetch(
    `https://api.github.com/repos/microsoft/fluentui/commits/${commitHash}`
  ).then((res) => res.json()).catch(err=>{
    console.log(err.message);
  });
  return data.commit.message;
};

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
          `\n${
            item.date
          }\n[Compare Changes](https://github.com/microsoft/fluentui/compare/@fluentui/react-charting_v${
            data.entries[index + 1].tag
          }..@fluentui/react-charting_v${item.version})\n`,
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
        fs.appendFileSync(
          minorVersion + ".md",
          "\n### Patches\n\n",
          throwError
        );
        item.comments.patch.map(async (patchItem, patchIndex) => {
          let PRMessage = await fetchPRNumber(patchItem.commit);
          const PRNumber = PRMessage.substring(
            PRMessage.lastIndexOf("("),
            PRMessage.length
          );
          fs.appendFileSync(
            minorVersion + ".md",
            "- " +
              patchItem.comment +
              `([${PRNumber}](https://github.com/microsoft/fluentui/pull/${PRNumber}) by ${patchItem.author})\n`,
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
// fetchPRNumber("2f30e149ee401e2ec25829fd3b178972bc030905");
