const tsCompiler = require('typescript');

exports.methodPlugin = function () {
  const mapName = 'methodMap';
  this[mapName] = {};

  function methodCheck(
    node,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    // 存在于函数调用表达式中
    if (node.parent && tsCompiler.isCallExpression(node.parent)) {
      // 命中函数名 method 检测
      if (node.parent.expression.pos === node.pos && node.parent.expression.end === node.end) {
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
    }
    return false;
  }

  return {
    mapName,
    checkAnalysis: methodCheck,
    afterHook: null
  };
};
