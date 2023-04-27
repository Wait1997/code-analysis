const tsCompiler = require('typescript');

exports.typePlugin = function () {
  const mapName = 'typeMap';
  this[mapName] = {};

  function typeCheck(node, depth, apiName, matchImportItem, filePath, projectName, httpRepo, line) {
    // 命中Type检测
    if (node.parent && tsCompiler.isTypeReferenceNode(node.parent)) {
      if (!this[mapName][apiName]) {
        this[mapName][apiName] = {};
        this[mapName][apiName].callNum = 1;
        this[mapName][apiName].callOrigin = matchImportItem.origin;
        this[mapName][apiName].callFiles = {};
        this[mapName][apiName].callFiles[filePath] = {};
        this[mapName][apiName].callFiles[filePath].projectName = projectName;
        this[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
        this[mapName][apiName].callFiles[filePath].lines = [];
        this[mapName][apiName].callFiles[filePath].lines.push(line);
      } else {
        this[mapName][apiName].callNum++;

        const keys = Object.keys(this[mapName][apiName].callFiles);
        if (!keys.includes(filePath)) {
          this[mapName][apiName].callFiles[filePath] = {};
          this[mapName][apiName].callFiles[filePath].projectName = projectName;
          this[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
          this[mapName][apiName].callFiles[filePath].lines = [];
          this[mapName][apiName].callFiles[filePath].lines.push(line);
        } else {
          this[mapName][apiName].callFiles[filePath].lines.push(line);
        }
      }

      return true;
    }

    return false;
  }

  return {
    mapName,
    checkAnalysis: typeCheck,
    afterHook: null
  };
};
