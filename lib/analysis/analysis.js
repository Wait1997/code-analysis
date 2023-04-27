const path = require('path');
const tsCompiler = require('typescript');
const { methodPlugin } = require('../plugins/methodPlugin');
const { typePlugin } = require('../plugins/typePlugin');
const { defaultPlugin } = require('../plugins/defaultPlugin');
const { scanFileTs } = require('../utils/file');
const { parseTs } = require('../utils/parse');
const { CODE_FILE_TYPE, IMPORT_TYPE } = require('../utils/constant');

class BaseAnalysis {
  constructor(options) {
    // 私有属性
    // 扫描源配置信息
    this._scanSource = options.scanSource;
    // 要分析的目标依赖配置
    this._analysisTarget = options.analysisTarget;
    // 需要分析的BrowserApi配置
    this._browserApis = options.browserApis || [];
    // 代码分析插件配置
    this._analysisPlugins = options.analysisPlugins || [];

    // 公共属性
    // Targer分析插件队列
    this.pluginsQueue = [];
    // importItem统计Map
    this.importItemMap = {};
  }

  // 注册插件
  _installPlugins(plugins) {
    if (plugins.length > 0) {
      for (const item of plugins) {
        this.pluginsQueue.push(item.call(this));
      }
    }

    // 注册method分析插件
    this.pluginsQueue.push(methodPlugin.call(this));
    // 注册type分析插件
    this.pluginsQueue.push(typePlugin.call(this));
    // 注册api分析插件
    this.pluginsQueue.push(defaultPlugin.call(this));
  }

  // 链式调用检查找出链路顶点node(自底向上)
  _checkPropertyAccess(node, index = 0, apiName = '') {
    if (index > 0) {
      apiName = `${apiName}.${node.name.escapedText}`;
    } else {
      apiName = apiName + node.escapedText;
    }
    if (tsCompiler.isPropertyAccessExpression(node.parent)) {
      index = index + 1;
      return this._checkPropertyAccess(node.parent, index, apiName);
    } else {
      // node为递归向上的顶层节点
      return {
        baseNode: node,
        depth: index,
        apiName: apiName
      };
    }
  }

  // 执行Target分析插件队列中的checkAnalysis函数
  _runAnalysisPlugins(
    baseNode,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    if (this.pluginsQueue.length > 0) {
      for (const plugin of this.pluginsQueue) {
        try {
          const checkAnalysis = plugin.checkAnalysis;
          const result = checkAnalysis.call(
            this,
            baseNode,
            depth,
            apiName,
            matchImportItem,
            filePath,
            projectName,
            httpRepo,
            line
          );
          // 根据上一个插件的结果判断是否要继续执行下一个插件
          if (result) {
            break;
          }
        } catch (error) {
          console.warn(error);
        }
      }
    }
  }

  // 执行Target分析插件队列中的afterHook函数
  _runAnalysisPluginsHook(importItems, ast, checker, filePath, projectName, httpRepo, baseLine) {
    if (this.pluginsQueue.length > 0) {
      for (const item of this.pluginsQueue) {
        const afterHook = item?.afterHook;
        if (afterHook && typeof afterHook === 'function') {
          afterHook.call(
            this,
            item.mapName,
            importItems,
            ast,
            checker,
            filePath,
            projectName,
            httpRepo,
            baseLine
          );
        }
      }
    }
  }

  // 获取需要分析文件的集合
  _fileTypeList(source, type) {
    switch (type) {
      case CODE_FILE_TYPE.VUE:
        // return scanFileVue(current);
        break;
      case CODE_FILE_TYPE.TS:
        return scanFileTs(source);
      default:
        break;
    }
  }

  // 截取资源下的所有文件集合
  _substrSourceFile(fileList, source, format) {
    return fileList.map((currentFile) => {
      if (format && typeof format === 'function') {
        return format(currentFile.substring(currentFile.indexOf(source)));
      }
      return currentFile.substring(currentFile.indexOf(source));
    });
  }

  // 获取资源路径的集合
  _sourcePathClump(paths, type) {
    const saveFilePath = {
      parse: [],
      show: []
    };
    for (const source of paths.path) {
      // 获取需要分析文件的集合
      const fileList = this._fileTypeList(source, type);
      const substrFileList = this._substrSourceFile(fileList, source, paths.format);
      saveFilePath.parse = saveFilePath.parse.concat(fileList);
      saveFilePath.show = saveFilePath.show.concat(substrFileList);
    }
    return saveFilePath;
  }

  /**
   * 扫描文件
   * @param {string[]} scanSource 配置项扫描指定目录下的代码文件
   * @param {vue|ts} type 文件类型
   * @returns
   */
  _scanFiles(scanSource, type) {
    const entrys = [];
    for (const item of scanSource) {
      const entryFile = {
        name: item.name,
        httpRepo: item.httpRepo
      };

      const saveFilePath = this._sourcePathClump(item, type);
      entryFile.parse = saveFilePath.parse;
      entryFile.show = saveFilePath.show;

      entrys.push(entryFile);
    }
    return entrys;
  }

  // 处理vue、ts文件的ast信息
  _dealFileAst(showPath, ast, checker, entryFile) {
    try {
      // 从import语句中获取导入的需要分析的目标
      const importItems = this._findImportItems(ast, showPath);

      if (Object.keys(importItems).length > 0) {
        // 递归分析AST，统计相关信息
        this._dealAST(importItems, ast, checker, showPath, entryFile.name, entryFile.httpRepo);
      }
    } catch (error) {
      console.warn(error);
    }
  }

  /**
   * 扫描文件
   * @param {string[]} scanSource 配置项扫描指定目录下的代码文件
   * @param {vue|ts} type 文件类型
   * @returns
   */
  _scanCode(scanSource, type) {
    // 获取文件信息集合
    const entrys = this._scanFiles(scanSource, type);

    for (const item of entrys) {
      const parseFiles = item.parse;

      if (parseFiles.length > 0) {
        parseFiles.forEach((currentFile, index) => {
          // 项目名称 + 路径下的文件
          const showPath = item.name + '&' + item.show[index];
          switch (type) {
            case CODE_FILE_TYPE.VUE:
              // const { ast, checker, baseLine } = parseVue(currentFile);
              // this._dealFileAst(showPath, ast, checker, item);
              break;
            case CODE_FILE_TYPE.TS:
              const { ast, checker } = parseTs(currentFile);
              this._dealFileAst(showPath, ast, checker, item);
              break;
            default:
              break;
          }
        });
      }
    }
  }

  currentNodeLine(ast, node, baseLine = 0) {
    // 获取当前node节点所在代码行
    const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
    return line;
  }

  selectedImportMethod(node, line) {
    // import 默认导入方式
    if (node.importClause && node.importClause.name) {
      return {
        type: IMPORT_TYPE.DefaultImport,
        value: {
          // 导入后在代码中真实调用使用的 API 名
          name: node.importClause.name.escapedText,
          // API别名 null则表示该非别名导入 name就是本身
          origin: null,
          // symbol指向的声明节点在代码字符串中的起始位置
          symbolPos: node.importClause.pos,
          // symbol指向的声明节点在代码字符串中的结束位置
          symbolEnd: node.importClause.end,
          // API 名字信息节点在代码字符串中的起始位置
          identifierPos: node.importClause.name.pos,
          // API 名字信息节点在代码字符串中的结束位置
          identifierEnd: node.importClause.name.end,
          // 导入 API 的import语句所在代码行信息
          line: line
        }
      };
    }
    if (node.importClause && node.importClause.namedBindings) {
      // 按需导入场景包括as别名
      if (tsCompiler.isNamedImports(node.importClause.namedBindings)) {
        if (
          node.importClause.namedBindings.elements &&
          node.importClause.namedBindings.elements.length > 0
        ) {
          const namedElements = node.importClause.namedBindings.elements;
          const namedInfoList = [];
          for (const element of namedElements) {
            if (tsCompiler.isImportSpecifier(element)) {
              namedInfoList.push({
                type: element.propertyName ? IMPORT_TYPE.NamedAliasImport : IMPORT_TYPE.NamedImport,
                value: {
                  name: element.name.escapedText,
                  origin: element.propertyName ? element.propertyName.escapedText : null,
                  symbolPos: element.pos,
                  symbolEnd: element.end,
                  identifierPos: element.name.pos,
                  identifierEnd: element.name.end,
                  line: line
                }
              });
            }
          }
          return namedInfoList;
        }
      }
      // * 全量导入as场景
      if (
        tsCompiler.isNamespaceImport(node.importClause.namedBindings) &&
        node.importClause.namedBindings.name
      ) {
        return {
          type: IMPORT_TYPE.DefaultNamedAliasImport,
          value: {
            name: node.importClause.namedBindings.name.escapedText,
            origin: '*',
            symbolPos: node.importClause.namedBindings.pos,
            symbolEnd: node.importClause.namedBindings.end,
            identifierPos: node.importClause.namedBindings.name.pos,
            identifierEnd: node.importClause.namedBindings.name.end,
            line: line
          }
        };
      }
    }
    return null;
  }

  // 分析import引入
  _findImportItems(ast, filePath, baseLine = 0) {
    const importItems = {};

    const dealImports = (data) => {
      const generateMap = (currentName, currentValue) => {
        importItems[currentName] = {};
        importItems[currentName].origin = currentValue.origin;
        importItems[currentName].symbolPos = currentValue.symbolPos;
        importItems[currentName].symbolEnd = currentValue.symbolEnd;
        importItems[currentName].identifierPos = currentValue.identifierPos;
        importItems[currentName].identifierEnd = currentValue.identifierEnd;
        if (!this.importItemMap[data.name]) {
          this.importItemMap[currentName] = {};
          this.importItemMap[currentName].callOrigin = currentValue.origin;
          this.importItemMap[currentName].callFiles = [];
          this.importItemMap[currentName].callFiles.push(filePath);
        } else {
          this.importItemMap[currentName].callFiles.push(filePath);
        }
      };

      if (Array.isArray(data)) {
        for (const item of data) {
          const currentName = item.value.name;
          const currentValue = item.value;
          generateMap(currentName, currentValue);
        }
      } else {
        const currentName = data.value.name;
        const currentValue = data.value;
        generateMap(currentName, currentValue);
      }
    };

    // 遍历AST寻找import节点
    const walkAst = (node) => {
      tsCompiler.forEachChild(node, walkAst);
      const currentLine = this.currentNodeLine(ast, node, baseLine);
      // 判断节点是否是import导入的
      if (tsCompiler.isImportDeclaration(node)) {
        // 命中要分析的目标依赖配置
        if (
          node.moduleSpecifier &&
          node.moduleSpecifier.text &&
          node.moduleSpecifier.text === this._analysisTarget
        ) {
          const receivedImportValue = this.selectedImportMethod(node, currentLine);
          receivedImportValue && dealImports(receivedImportValue);
        }
      }
    };

    walkAst(ast);

    return importItems;
  }

  // AST分析
  _dealAST(importItems, ast, checker, filePath, projectName, httpRepo, baseLine = 0) {
    const importItemsNames = Object.keys(importItems);

    const walkAst = (node) => {
      tsCompiler.forEachChild(node, walkAst);
      const currentLine = this.currentNodeLine(ast, node, baseLine);

      if (
        tsCompiler.isIdentifier(node) &&
        node.escapedText &&
        importItemsNames.length > 0 &&
        importItemsNames.includes(node.escapedText)
      ) {
        // 命中Target Api Item Name
        const matchImportItem = importItems[node.escapedText];

        // 排除importItems Node 自身
        if (
          node.pos !== matchImportItem.identifierPos &&
          node.end !== matchImportItem.identifierEnd
        ) {
          const symbol = checker.getSymbolAtLocation(node);

          // 存在上下文声明
          if (symbol && symbol.declarations && symbol.declarations.length > 0) {
            const nodeSymbol = symbol.declarations[0];

            // 上下文声明与import匹配, 符合API调用
            if (
              matchImportItem.symbolPos === nodeSymbol.pos &&
              matchImportItem.symbolEnd === nodeSymbol.end
            ) {
              // 如果存在父级节点则为节点调用
              if (node.parent) {
                // 获取基础分析节点信息
                const { baseNode, depth, apiName } = this._checkPropertyAccess(node);
                this._runAnalysisPlugins(
                  baseNode,
                  depth,
                  apiName,
                  matchImportItem,
                  filePath,
                  projectName,
                  httpRepo,
                  currentLine
                );
              }
            }
          }
        }
      }
    };

    walkAst(ast);

    // 执行afterhook
    this._runAnalysisPluginsHook(
      importItems,
      ast,
      checker,
      filePath,
      projectName,
      httpRepo,
      baseLine
    );
  }

  analysis() {
    // 注册插件
    this._installPlugins(this._analysisPlugins);
    // 扫描分析TS
    this._scanCode(this._scanSource, CODE_FILE_TYPE.TS);
  }
}

module.exports = BaseAnalysis;
