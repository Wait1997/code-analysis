exports.defaultPlugin = function () {
  const mapName = 'apiMap';
  // 在分析实例上下文挂载副作用
  this[mapName] = {};

  /**
   * 执行check函数在analysis实例上挂载mapName属性
   * @param {*} node 需要分析的baseNode节点
   * @param {*} depth 需要分析的Identifier调用的深度
   * @param {*} apiName 需要分析的Identifier完整的apiName
   * @param {*} matchImportItem import导入节点时的真实name
   * @param {*} filePath 当前分析的文件路径
   * @param {*} projectName 当前的项目名称
   * @param {*} httpRepo 当前的仓库名称
   * @param {*} line 当前所在的代码行数
   */
  function apiCheck(node, depth, apiName, matchImportItem, filePath, projectName, httpRepo, line) {
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
    // 命中规则, 终止执行后序插件
    return true;
  }

  return {
    mapName,
    checkAnalysis: apiCheck,
    afterHook: null
  };
};
