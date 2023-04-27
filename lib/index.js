const BaseAnalysis = require('./analysis/analysis');

const config = {
  // 必须，待扫描源码的配置信息
  scanSource: [
    {
      name: 'Demo', // 必填，项目名称
      path: ['src'], // 必填，需要扫描的文件路径（基准路径为配置文件所在路径）
      packageFile: 'package.json', // 可选，package.json 文件路径配置，用于收集依赖的版本信息
      format: null, // 可选, 文件路径格式化函数,默认为null,一般不需要配置
      httpRepo: ''
    }
  ],
  // 必须，要分析的目标依赖名
  analysisTarget: 'framework',
  // 可选，要分析的BrowserApi，默认为空数组
  browserApis: ['window', 'document', 'history', 'location']
};

const coderTask = new BaseAnalysis(config);

coderTask.analysis();

console.log(coderTask.apiMap);
