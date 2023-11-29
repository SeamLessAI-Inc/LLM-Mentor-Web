/**
 *
 * @param {Array.<{type: 'positiveInt'|'string', name: string}>} schema - The array of objects.
 */
module.exports = function ParamValidateFactory(schema) {
  return function (param) {
    for (const it of schema) {
      let value = param[it.name];
      if (value === undefined) {
        return false;
      }
      switch (it.type) {
        case 'positiveInt':
          if (typeof value === 'string') {
            value = Number(value);
          }
          if (Number.isInteger(value) && value > 0) {
            continue;
          }
          else {
            return false;
          }
        case 'naturalInt':
          if (typeof value === 'string') {
            value = Number(value);
          }
          if (Number.isInteger(value) && value >= 0) {
            continue;
          }
          else {
            return false;
          }
        case 'string':
          if (typeof value === 'string' && !!value.trim()) {
            continue;
          }
          else {
            return false;
          }
        case 'strArray':
          return Array.isArray(value) && value.every(it => typeof it === 'string');
        case 'percentNum':
          let val = +value;
          return !Number.isNaN(val) && val <= 1 && val >= 0;
        case 'isSet':
          return val !== undefined;
        default:
          return false;
      }
    }
    return true;
  };
}