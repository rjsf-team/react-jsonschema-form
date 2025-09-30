global.structuredClone = (val) => {
  if (!val) {
    return val;
  }
  return JSON.parse(JSON.stringify(val));
};
