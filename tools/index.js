const fs = require('fs');
const path = require('path');
const elasticlunr = require('elasticlunr');

// index path
const indexPath = path.join(__dirname, '..', 'index.json');

// construct index
const index = elasticlunr();
index.addField('title');
index.addField('urls');
index.setRef('id');

exports.index = index;
exports.indexPath = indexPath;
exports.loadIndex = () => elasticlunr.Index.load(JSON.parse(fs.readFileSync(indexPath).toString()));
