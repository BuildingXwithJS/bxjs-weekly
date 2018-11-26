const enrichResults = (res, index) =>
  res.slice(0, 5).map(({ref, score}) => ({
    ...index.documentStore.getDoc(ref),
    score,
  }));

exports.findInTitles = (title, index) => {
  const results = index.search(title, {
    fields: {
      title: {boost: 1},
    },
  });
  return enrichResults(results, index);
};

exports.findInUrls = (url, index) => {
  const results = index.search(url, {
    fields: {
      title: {boost: 0},
      urls: {boost: 1},
    },
  });
  return enrichResults(results, index);
};
