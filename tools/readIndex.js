const {loadIndex} = require('./index');

const index = loadIndex();

const enrichResults = res =>
  res.slice(0, 5).map(({ref, score}) => ({
    ...index.documentStore.getDoc(ref),
    score,
  }));

const findInTitles = title => {
  const results = index.search(title);
  return enrichResults(results);
};

const findInUrls = url => {
  const results = index.search(url, {
    fields: {
      title: {boost: 0},
      urls: {boost: 1},
    },
  });
  return enrichResults(results);
};
