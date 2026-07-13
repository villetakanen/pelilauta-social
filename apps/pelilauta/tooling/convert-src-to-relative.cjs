#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function main(){
  const repoRoot = path.resolve(__dirname, '..');
  const exts = new Set(['.ts','.js','.tsx','.jsx','.svelte','.astro']);
  const ignoreDirs = new Set(['node_modules','dist','.git']);
  const files = [];

  async function walk(dir){
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for(const e of entries){
      const full = path.join(dir, e.name);
      if(e.isDirectory()){
        if(ignoreDirs.has(e.name)) continue;
        await walk(full);
      } else if(e.isFile()){
        const ext = path.extname(e.name);
        if(exts.has(ext)) files.push(full);
      }
    }
  }

  await walk(repoRoot);

  let changed = 0;
  for(const file of files){
    let raw = await fs.readFile(file, 'utf8');
    let content = raw;

    // match 'src/...' or "src/..." inside quotes following from or import or await import
    const re = /(['"])src\/([^'"\n]+)\1/g;
    content = content.replace(re, (match, quote, rest) => {
      const modulePath = 'src/' + rest;
      const target = path.join(repoRoot, modulePath);
      // if target doesn't exist, leave as-is
      try{
        // check file existence with extension variants if necessary
        if (!fsStatExistsSync(target)) return match;
      } catch(e){
        return match;
      }

      const rel = path.relative(path.dirname(file), target).replace(/\\/g, '/');
      const relWithDot = rel.startsWith('.') ? rel : './' + rel;
      return quote + relWithDot + quote;
    });

    if(content !== raw){
      await fs.writeFile(file, content, 'utf8');
      changed++;
      console.log('Updated', path.relative(repoRoot, file));
    }
  }

  console.log('Modified', changed, 'files.');
}

function fsStatExistsSync(p){
  // synchronous existence check using fs.access sync via require('fs') to avoid async in replace
  const fsSync = require('fs');
  try{ fsSync.accessSync(p); return true; } catch(e) { return false; }
}

main().catch(err => { console.error(err); process.exit(1); });
