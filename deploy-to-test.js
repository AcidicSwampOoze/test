import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义路径和分支名称
const DIST_DIR = path.join(__dirname, 'dist'); // Vue 打包后的目录
const DEPLOY_DIR = path.join(__dirname, '..', 'deploy', 'test'); // 目标部署目录
const TARGET_BRANCH = 'test_pages'; // 目标分支

try {
  console.log('Step 1: 正在打包收拾行李...');
  execSync('npm run build', { stdio: 'inherit' }); // 执行打包命令

  console.log('Step 2: 正在检查发布目录...');
  if (fs.existsSync(DEPLOY_DIR)) {
    const deployBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: DEPLOY_DIR }).toString().trim();
    if (deployBranch !== TARGET_BRANCH) {
      console.log(`发布目录当前分支为 ${deployBranch}, 正在切换到 ${TARGET_BRANCH}...`);
      execSync(`git checkout ${TARGET_BRANCH}`, { cwd: DEPLOY_DIR }); // 切换到目标分支
    } else {
      console.log(`发布目录当前分支为 ${TARGET_BRANCH}.`);
    }
  } else {
    throw new Error(`文件夹路径错误: ${DEPLOY_DIR} 不存在`);
  }

  console.log('Step 3: 正在打扫发布目录...');
  const files = fs.readdirSync(DEPLOY_DIR);
  files.forEach((file) => {
    // 跳过 .git 文件夹和其他隐藏目录
    if (file.startsWith('.')) {
      return;
    }
    const filePath = path.join(DEPLOY_DIR, file);
    fs.rmSync(filePath, { recursive: true, force: true }); // 清空其中的内容
  }); 

  console.log('Step 4: 正在搬运到发布目录...');
  const distFiles = fs.readdirSync(DIST_DIR);
  distFiles.forEach((file) => {
    const srcPath = path.join(DIST_DIR, file);
    const destPath = path.join(DEPLOY_DIR, file);
    fs.cpSync(srcPath, destPath, { recursive: true }); // 复制文件
  });

  console.log('Step 5: 添加所有更改...');
  execSync('git add .', { cwd: DEPLOY_DIR }); // 添加所有更改

  console.log('Step 6: 提交更改...');
  execSync('git commit -m "Auto-deploy to test_pages branch"', { cwd: DEPLOY_DIR }); // 提交更改

  console.log('Step 7: 推送到远程分支...');
  execSync(`git push origin ${TARGET_BRANCH}`, { cwd: DEPLOY_DIR }); // 推送到远程分支

  console.log('自动部署完成！');
} catch (error) {
  console.error('Error during deployment:', error.message);
  process.exit(1); // 如果出错，退出脚本
}