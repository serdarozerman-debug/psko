#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../../package.json');

const banner = `
${cyan}   ██████╗ █████╗ ████████╗ █████╗ ██╗  ██╗   ██╗███████╗████████╗
  ██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██║  ╚██╗ ██╔╝██╔════╝╚══██╔══╝
  ██║     ███████║   ██║   ███████║██║   ╚████╔╝ ███████╗   ██║
  ██║     ██╔══██║   ██║   ██╔══██║██║    ╚██╔╝  ╚════██║   ██║
  ╚██████╗██║  ██║   ██║   ██║  ██║███████╗██║   ███████║   ██║
   ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝   ╚══════╝   ╚═╝${reset}

  Catalyst OS ${dim}v${pkg.version}${reset}
  AI-native spec-driven development framework for Claude Code
`;

// Parse args
const args = process.argv.slice(2);
const hasHelp = args.includes('--help') || args.includes('-h');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx catalyst-os [options]

  ${yellow}Options:${reset}
    ${cyan}-h, --help${reset}    Show this help message

  ${yellow}What gets installed:${reset}
    ${dim}.claude/${reset}       Agents, skills, and slash commands
    ${dim}.catalyst/${reset}     Spec templates and project config

  ${yellow}Example:${reset}
    ${dim}# Initialize catalyst-os in your project${reset}
    cd your-project
    npx catalyst-os

  ${yellow}After installation:${reset}
    Run ${cyan}/catalyze-project${reset} to initialize your project
    Run ${cyan}/catalyze-spec${reset} to create your first specification
`);
  process.exit(0);
}

/**
 * Recursively copy directory
 */
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy file if it exists
 */
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

/**
 * Install catalyst-os to current directory
 */
function install() {
  const src = path.join(__dirname, '../..');
  const cwd = process.cwd();

  console.log(`  Installing to ${cyan}${cwd}${reset}\n`);

  // Check if already installed
  const claudeDir = path.join(cwd, '.claude');
  const catalystDir = path.join(cwd, '.catalyst');

  if (fs.existsSync(path.join(claudeDir, 'agents'))) {
    console.log(`  ${yellow}Warning:${reset} .claude/agents already exists`);
    console.log(`  ${dim}Files will be overwritten${reset}\n`);
  }

  // Install .claude/agents
  const agentsSrc = path.join(src, '.claude', 'agents');
  const agentsDest = path.join(claudeDir, 'agents');
  if (fs.existsSync(agentsSrc)) {
    copyDir(agentsSrc, agentsDest);
    console.log(`  ${green}✓${reset} Installed .claude/agents`);
  }

  // Install .claude/commands
  const commandsSrc = path.join(src, '.claude', 'commands');
  const commandsDest = path.join(claudeDir, 'commands');
  if (fs.existsSync(commandsSrc)) {
    copyDir(commandsSrc, commandsDest);
    console.log(`  ${green}✓${reset} Installed .claude/commands`);
  }

  // Install .claude/skills
  const skillsSrc = path.join(src, '.claude', 'skills');
  const skillsDest = path.join(claudeDir, 'skills');
  if (fs.existsSync(skillsSrc)) {
    copyDir(skillsSrc, skillsDest);
    console.log(`  ${green}✓${reset} Installed .claude/skills`);
  }

  // Install config files
  const configs = [
    ['.catalyst/spec-structure.yaml', '.catalyst/spec-structure.yaml'],
    ['.catalyst/main/project-config.yaml', '.catalyst/main/project-config.yaml']
  ];

  for (const [srcFile, destFile] of configs) {
    const srcPath = path.join(src, srcFile);
    const destPath = path.join(cwd, destFile);
    if (copyFile(srcPath, destPath)) {
      console.log(`  ${green}✓${reset} Installed ${destFile}`);
    }
  }

  // Create specs directory if it doesn't exist
  const specsDir = path.join(catalystDir, 'specs');
  if (!fs.existsSync(specsDir)) {
    fs.mkdirSync(specsDir, { recursive: true });
    console.log(`  ${green}✓${reset} Created .catalyst/specs/`);
  }

  // Install AGENTS.md
  const agentsMdSrc = path.join(src, 'AGENTS.md');
  const agentsMdDest = path.join(cwd, 'AGENTS.md');
  if (copyFile(agentsMdSrc, agentsMdDest)) {
    console.log(`  ${green}✓${reset} Installed AGENTS.md`);
  }

  console.log(`
  ${green}Done!${reset}

  ${yellow}Next steps:${reset}
    1. Run ${cyan}/catalyze-project${reset} to initialize your project
    2. Run ${cyan}/catalyze-spec${reset} to create your first specification
    3. Run ${cyan}/forge-spec${reset} to implement it

  ${dim}Documentation: https://github.com/Ealikadioglu/catalyst-os${reset}
`);
}

// Run installation
install();
