const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const commonmark = require('commonmark');
const CommonmarkPDFRenderer = require('pdfkit-commonmark').default;
const PDFDocument = require('pdfkit');

// promisified functions
const readDir = promisify(fs.readdir);

// paths
const pdfPath = path.join(__dirname, '..', 'bxjs.pdf');
const linksPath = path.join(__dirname, '..', 'links');

const run = async () => {
  const files = (await readDir(linksPath)).sort((a, b) => a.localeCompare(b));
  const lastEpisode = files.pop();
  const lastEpisodePath = path.join(linksPath, lastEpisode);
  const episodeText = fs.readFileSync(lastEpisodePath).toString();

  // get parser instance
  const reader = new commonmark.Parser();
  // parse input
  const parsed = reader.parse(episodeText);
  // get pdf renderer instance
  const writer = new CommonmarkPDFRenderer();
  // create pdf document
  const doc = new PDFDocument();
  // write pdf to some file in the current directory
  doc.pipe(fs.createWriteStream(pdfPath));
  // render parsed markdown to pdf
  writer.render(doc, parsed);
  // end the document
  doc.end();
};

run().catch(e => console.error('Error generating PDF:', e));
