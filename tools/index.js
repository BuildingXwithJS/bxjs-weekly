const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const _ = require('highland');

// promisified functions
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// paths
const linksPath = path.join(__dirname, '..', 'links');

// gets all links from string
const extractLinks = str => {
  const results = [];
  const regex = /\[(.+?)\]\((.+?)\)/g;
  let res = regex.exec(str);
  while (res) {
    const url = res[2];
    results.push(url);
    res = regex.exec(str);
  }
  return results;
};

const run = async () => {
  _(readDir(linksPath))
    .flatMap(arr => _(arr))
    .flatMap(filename => {
      const filePath = path.join(linksPath, filename);
      return _(readFile(filePath)).map(res => res.toString());
    })
    .take(1)
    .flatMap(markdown => {
      const sections = markdown.split('## ');
      return _(sections);
    })
    .filter(section => section && section.length > 0)
    .map(section => section.replace(/\r/g, ''))
    .flatMap(section => {
      const [name, linksText] = section.split(/:\n/g);
      const sectionName = name.trim();
      const links = linksText.split('\n');
      return _(links)
        .filter(l => l && l.length > 0)
        .map(link => {
          const urls = extractLinks(link);
          const title = link
            .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
            .replace(/^-/g, '')
            .trim();
          return {
            category: sectionName,
            title,
            urls,
          };
        });
    })
    .each(result => {
      console.log('----------------------------\n', result);
    });
};

run().catch(error => console.error('Error when running indexing:', error));
