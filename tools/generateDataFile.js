const fs = require('fs');
const path = require('path');
const {folderToDocuments} = require('./episodesToDocuments');

// paths
const dataPath = path.join(__dirname, '..', 'bxjs.json');
const linksPath = path.join(__dirname, '..', 'links');

folderToDocuments(linksPath).toArray(data => {
  fs.writeFile(dataPath, JSON.stringify(data), () => {
    console.log('Successfully saved data!');
  });
});
