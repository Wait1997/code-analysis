const tsCompiler = require('typescript');

// 待分析代码片段字符串
const tsCode = `import { app } from 'framework';                                

const dataLen = 3;
let name = 'iceman';

if (app) {
  console.log(name);
}

function getInfos(info: string) {
  const result = app.get(info);
  return result;
}`;

// 获取ast节点
const ast = tsCompiler.createSourceFile('test', tsCode, tsCompiler.ScriptTarget.Latest, true);

const apiMap = {};

/**
 * 判断节点类型的函数，返回值类型为 boolean
 * tsCompiler.isFunctionDeclaration(node); // 判定是否为函数声明节点
 * tsCompiler.isArrowFunction(node); // 判定是否为箭头函数
 * tsCompiler.isTypeReferenceNode(node); // 判定是否为Type类型节点
 * tsCompiler.isVariableDeclaration(node); // 判定是否为变量声明节点
 * tsCompiler.isIdentifier(node); // 判定是否为Identifier节点
 * ast.getLineAndCharacterOfPosition() // 获取当前遍历节点的代码行信息
 */

// ast遍历函数
function walk(node) {
  // 递归遍历ast节点
  tsCompiler.forEachChild(node, walk);
  // 获取当前node节点所在代码行
  const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  if (tsCompiler.isIdentifier(node) && node.escapedText === 'app') {
    if (Object.keys(apiMap).includes(node.escapedText)) {
      apiMap[node.escapedText].callNum++;
      apiMap[node.escapedText].callLines.push(line);
    } else {
      apiMap[node.escapedText] = {};
      apiMap[node.escapedText].callNum = 1;
      apiMap[node.escapedText].callLines = [];
      apiMap[node.escapedText].callLines.push(line);
    }
  }
}

walk(ast);

console.log(apiMap);
