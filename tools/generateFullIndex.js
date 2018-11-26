const fs = require('fs');
const path = require('path');
const {index, indexPath} = require('./index');
const {folderToDocuments} = require('./episodesToDocuments');

// paths
const linksPath = path.join(__dirname, '..', 'links');

folderToDocuments(linksPath)
  .each(result => {
    index.addDoc(result);
  })
  .done(() => {
    const indexJSON = index.toJSON();
    fs.writeFile(indexPath, JSON.stringify(indexJSON), () => {
      console.log('Successfully saved index!');
    });
  });
