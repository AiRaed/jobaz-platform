/**
 * One-off migration helper — replaces direct OpenAI usage in tool API routes.
 * Run: node scripts/migrate-ai-provider-routes.mjs
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

function collectRouteFiles(dir) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  const stat = fs.statSync(full)
  if (stat.isFile() && full.endsWith('route.ts')) return [full]
  if (!stat.isDirectory()) return []

  const directRoute = path.join(full, 'route.ts')
  const files = fs.existsSync(directRoute) ? [directRoute] : []

  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(path.join(dir, entry.name)))
    }
  }
  return files
}

const TARGET_ROOTS = [
  'app/api/cv',
  'app/api/cover',
  'app/api/proofreading',
  'app/api/interview',
  'app/api/generate',
  'app/api/rewrite',
  'app/api/uk-career-assistant',
]

function featureFromPath(filePath) {
  return path
    .relative(ROOT, filePath)
    .replace(/\\/g, '/')
    .replace(/^app\/api\//, '')
    .replace(/\/route\.ts$/, '')
}

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8')
  if (!src.includes('openai.chat.completions.create') && !src.includes('new OpenAI')) {
    return false
  }

  const usesQuality = src.includes('getOpenAiQualityModel')
  const modelTier = usesQuality ? 'quality' : 'default'
  const feature = featureFromPath(filePath)

  src = src.replace(/^import OpenAI from ['"]openai['"]\r?\n/m, '')
  src = src.replace(/^import \{[^}]+\} from ['"]@\/lib\/openai-model['"]\r?\n/m, '')

  if (!src.includes("from '@/lib/jobaz-ai/providers'")) {
    const firstImport = src.match(/^import .+\r?\n/m)
    if (firstImport) {
      const idx = src.indexOf(firstImport[0]) + firstImport[0].length
      src =
        src.slice(0, idx) +
        "import { aiProvider } from '@/lib/jobaz-ai/providers'\n" +
        src.slice(idx)
    }
  }

  src = src.replace(/^const openai = new OpenAI\(\{[\s\S]*?\}\)\r?\n\r?\n/m, '')
  src = src.replace(/^const openai = new OpenAI\(\{[\s\S]*?\}\)\r?\n/m, '')

  src = src.replace(/if \(!process\.env\.OPENAI_API_KEY\)/g, 'if (!aiProvider.isConfigured())')

  src = src.replace(
    /await openai\.chat\.completions\.create\(\{([\s\S]*?)\}\)/g,
    (_match, body) => {
      const messagesMatch = body.match(/messages:\s*(\[[\s\S]*?\]),?\r?\n/)
      const temperatureMatch = body.match(/temperature:\s*([^,\n]+)/)
      const maxTokensMatch = body.match(/max_tokens:\s*([^,\n]+)/)

      let options = `{\n      messages: ${messagesMatch ? messagesMatch[1] : '[]'},\n      modelTier: '${modelTier}'`
      if (temperatureMatch) options += `,\n      temperature: ${temperatureMatch[1].trim()}`
      if (maxTokensMatch) options += `,\n      maxTokens: ${maxTokensMatch[1].trim()}`
      options += `,\n      feature: '${feature}',\n    }`
      return `await aiProvider.generateText(${options})`
    }
  )

  src = src.replace(/(\w+)\.choices\[0\]\?\.message\?\.content(?:\?\.trim\(\))?\s*\?\?\s*''/g, '$1.text')
  src = src.replace(/(\w+)\.choices\[0\]\?\.message\?\.content/g, '$1.text')

  fs.writeFileSync(filePath, src, 'utf8')
  return true
}

const files = [...new Set(TARGET_ROOTS.flatMap(collectRouteFiles))]
let changed = 0
for (const file of files) {
  if (migrateFile(file)) {
    changed++
    console.log('migrated', path.relative(ROOT, file))
  }
}
console.log(`Done. ${changed} files updated.`)
