global.structuredClone = (val) => {
  return JSON.parse(JSON.stringify(val));
};
  