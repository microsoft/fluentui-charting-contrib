const fs = require("fs")

const fetchChangelog = async() => {
  const data=await fetch("https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-charting/CHANGELOG.json").then(res=>res.json())
  data.entries.map((item,index)=>{
    let currVersion="";
    if(item.tag.startsWith("@fluentui/react-charting"))
    {
      let versionSplit = item.version.split('.')
      console.log(versionSplit)
      const minorVersion=(versionSplit[0]+"."+versionSplit[1]);
      if("patch" in item.comments){
        item.comments.patch.map((patchItem,patchIndex)=>{
          fs.appendFile(minorVersion+".md",patchItem.comment+"\n",(err)=>{
            if(err) throw err;
          });
        })
      }
      if("none" in item.comments){
        item.comments.none.map((noneItem,noneIndex)=>{
          fs.appendFile(minorVersion+".md",noneItem.comment+"\n",(err)=>{
            if(err) throw err;
          });
        })
      }
      if("minor" in item.comments){
        item.comments.minor.map((minorItem,minorIndex)=>{
          fs.appendFile(minorVersion+".md",minorItem.comment+"\n",(err)=>{
            if(err) throw err;
          });
        })
      }
      if("major" in item.comments){
        item.comments.major.map((majorItem,majorIndex)=>{
          fs.appendFile(minorVersion+".md",majorItem.comment+"\n",(err)=>{
            if(err) throw err;
          });
        })
      }
    }
      
    
  })
}
fetchChangelog();