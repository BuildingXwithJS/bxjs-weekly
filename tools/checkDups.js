const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const _ = require('highland');
const levenshtein = require('fast-levenshtein');
const {index} = require('./index');
const {folderToDocuments, fileToContent, fileToDocuments} = require('./episodesToDocuments');
const {findInTitles, findInUrls} = require('./readIndex');

// promisified functions
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// paths
const linksPath = path.join(__dirname, '..', 'links');

const arrayMod = arr => arr.slice(0, arr.length - 1);

const aggregateLevels = arr => [...new Set(arr.map(item => item.matchLevel))];

const prettyPrintByTitle = dup => {
  if (!dup.closestTitleMatches.length) {
    return '';
  }

  return `Existing documents (matching title):

  ${dup.closestTitleMatches.map(it => `${it.title} - ${it.urls}`).join('\n  ')}
`;
};

const prettyPrintByUrls = dup => {
  if (!dup.closestUrlMatches.length) {
    return '';
  }

  return `Existing documents (matching urls):

  ${dup.closestUrlMatches.map(it => `${it.title} - ${it.urls}`).join('\n  ')}

`;
};

const prettyPrintDuplicate = dup => {
  console.log(`
${dup.levels.includes('error') ? 'EXACT MATCH DETECTED:' : 'Possible duplicate:'}

New document: 

  ${dup.newDocument.title} - ${dup.newDocument.urls}

${prettyPrintByTitle(dup)}
${prettyPrintByUrls(dup)}
`);
};

const withDistance = ({arr, doc, field, threshold}) =>
  arr
    .map(res => ({
      ...res,
      distance: levenshtein.get(doc[field], res[field]),
    }))
    .map(res => ({
      ...res,
      matchLevel: res.distance === 0 ? 'error' : 'warning',
    }))
    .filter(({distance}) => distance < threshold);

const run = async () => {
  await folderToDocuments(linksPath, {arrayMod})
    .each(result => index.addDoc(result))
    .toPromise(Promise);
  console.log('Successfully generated index!');

  const files = (await readDir(linksPath)).sort((a, b) => a.localeCompare(b));
  const lastFile = files.pop();
  let shouldThrow = false;
  const res = await fileToContent(lastFile, linksPath)
    .flatMap(content => fileToDocuments(content))
    .flatMap(doc => {
      const titleRes = findInTitles(doc.title, index);
      const urlsRes = findInUrls(doc.urls, index);

      const closestTitleMatches = withDistance({arr: titleRes, doc, field: 'title', threshold: 3});
      const closestUrlMatches = withDistance({arr: urlsRes, doc, field: 'urls', threshold: 5});

      const match = closestTitleMatches.length + closestUrlMatches.length;

      if (match === 0) {
        return _([]);
      }

      const possibleDuplicate = {
        match,
        newDocument: doc,
        levels: aggregateLevels(closestTitleMatches.concat(closestUrlMatches)),
        closestTitleMatches,
        closestUrlMatches,
      };

      return _([possibleDuplicate]);
    })
    .filter(result => result)
    .each(duplicate => {
      if (duplicate.levels.includes('error')) {
        shouldThrow = true;
      }

      prettyPrintDuplicate(duplicate);
    })
    .done(() => {
      if (shouldThrow) {
        throw new Error('Possible duplicate detected!');
      }
    });
};

run();
