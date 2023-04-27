const path = require('path');
const glob = require('glob');

/**
 * glob:
 * \\ 字符被保留作为转义符使用
 * * 匹配单级目录下的文件(*.js)
 * ** 匹配嵌套目录下的文件(scripts/**\/*.js 匹配scripts文件夹下的所有的文件)
 * ? 表示匹配 1 个字符(abc?.js表示匹配abc0.js 或 abc1.js) 必须存在
 * ?(pattern|pattern|pattern) 匹配满足0个条件或1个条件的文件(test/dir/?(ab)c.js匹配在test/dir文件夹下的 abc.js 或 c.js 文件)
 * !(pattern|pattern|pattern) 匹配不满足提供的条件的文件(test/dir/!(a|c)b.js匹配在test/dir文件夹下，非a、c开头的，以b结尾的文件)
 * +(pattern|pattern|pattern) 匹配满足 1 个及以上条件的文件(test/dir/+(ab)c.js匹配到test/dir文件夹下的ababc.js或abc.js)
 * *(pattern|pattern|pattern) 匹配满足 0 个及以上条件的文件(test/dir/*(a|b)b.js匹配到test/dir文件夹下的b.js、ab.js或bb.js 文件)
 * @(pattern|pat*|pat?erN) 精确匹配提供条件之一的文件(test/dir/@(a|c)b.js精确匹配 test/dir 文件夹下的 ab.js 或 cb.js 文件)
 * 字符范围匹配 例如[a-z]、[0-9]、[^0-9]、[!0-9] 其中 ^|! 表示取反操作
 */

/**
 * 扫描TS文件
 * @param {string} scanPath 扫描scanPath目录及其子目录下所有的 TS、TSX 文件
 * @returns 返回它们的文件路径信息
 */
exports.scanFileTs = function (scanPath) {
  const tsPaths = path.join(process.cwd(), `${scanPath}/**/*.ts`);
  const tsxPaths = path.join(process.cwd(), `${scanPath}/**/*.tsx`);
  // 匹配目标路径下的所有ts文件路径
  const tsFiles = glob.sync(tsPaths);
  // 匹配目标路径下的所有tsx文件路径
  const tsxFiles = glob.sync(tsxPaths);

  return tsFiles.concat(tsxFiles);
};
