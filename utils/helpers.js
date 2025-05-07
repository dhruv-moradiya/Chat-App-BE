const areArraysEqual = (arr1, arr2) => {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  if (set1.size !== set2.size) {
    return false;
  }

  for (const item of set1) {
    if (!set2.has(item)) {
      return false;
    }
  }

  return true;
};

const stripBase64Prefix = (base64String) => {
  return base64String.replace(/^data:.+;base64,/, "");
};

export { areArraysEqual, stripBase64Prefix };
