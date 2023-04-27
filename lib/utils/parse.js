/**
 * TypeScript 编译原理
 * 主要包含
 * scanner 扫描器（scanner.ts）扫描源代码进行词法分析后生成的 Token 流
 * parser 解析器（parser.ts）Parser 将 Token 流进行语法分析 生成 AST 对象
 * binder 绑定器（binder.ts）Binder 会创建一个用来存储每个 AST 节点和对应符号 Symbol 的映射表
 * checker 检查器（checker.ts）Checker 用来检查代码中变量的类型信息
 * emitter 发射器（emitter.ts）处理 Node 节点，将 AST 转化为 js、d.ts、map等编译产物
 */

const tsCompiler = require('typescript');

/**
 * 解析ts文件代码，获取ast，checker
 * @param {string} fileName
 * @returns ast，checker
 */
exports.parseTs = function (fileName) {
  /**
   * 创建Program
   * fileName参数表示文件路径列表
   * options参数是编译选项，可以理解成tsconfig
   */
  const options = {};
  const program = tsCompiler.createProgram([fileName], options);
  /**
   * 从 Program 中获取 SourceFile 即 AST对象
   * fileName表示某一个文件路径
   */
  const ast = program.getSourceFile(fileName);
  /**
   * 获取 TypeChecker 控制器
   * 该控制器用来类型检查、语义检查
   */
  const checker = program.getTypeChecker();

  return { ast, checker };
};
