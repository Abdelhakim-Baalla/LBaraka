'use client'
import React from 'react'

interface SyntaxHighlighterProps {
  code: string
  language?: string
}

type TokenType =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'directive'
  | 'type'
  | 'function'
  | 'jsx-tag'
  | 'jsx-component'
  | 'jsx-attr'
  | 'number'
  | 'arrow'
  | 'operator'
  | 'identifier'
  | 'decorator'
  | 'plain'

interface Token {
  type: TokenType
  value: string
}

const KEYWORDS = [
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'async', 'await', 'if', 'else', 'for', 'while', 'class', 'extends',
  'new', 'this', 'try', 'catch', 'throw', 'default', 'switch', 'case',
  'break', 'continue', 'typeof', 'instanceof', 'in', 'of', 'true',
  'false', 'null', 'undefined', 'void', 'delete', 'enum', 'interface',
  'type', 'implements', 'super', 'yield', 'static', 'private', 'public',
  'protected', 'readonly', 'abstract', 'as', 'module', 'namespace',
]

const TYPES = [
  'React', 'NextRequest', 'NextResponse', 'Promise', 'string', 'number',
  'boolean', 'any', 'void', 'never', 'unknown', 'object', 'Array',
  'Record', 'Partial', 'Required', 'Pick', 'Omit', 'Map', 'Set',
  'Date', 'Error', 'RegExp', 'HTMLElement', 'JSX', 'FC', 'Component',
  'Injectable', 'Module', 'Controller', 'Service', 'Guard', 'Prisma',
  'PrismaService', 'JwtService', 'ConfigService', 'MongooseModule',
]

const colorMap: Record<TokenType, string> = {
  comment: 'text-green-500 italic',
  string: 'text-amber-400',
  keyword: 'text-purple-400 font-medium',
  directive: 'text-rose-400 font-semibold',
  type: 'text-cyan-400',
  function: 'text-yellow-300',
  'jsx-tag': 'text-sky-400',
  'jsx-component': 'text-emerald-400 font-medium',
  'jsx-attr': 'text-orange-300',
  number: 'text-orange-400',
  arrow: 'text-purple-400',
  operator: 'text-gray-400',
  identifier: 'text-gray-200',
  decorator: 'text-yellow-400',
  plain: 'text-gray-300',
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let remaining = line

  while (remaining.length > 0) {
    let matched = false

    // Comments
    if (remaining.startsWith('//')) {
      tokens.push({ type: 'comment', value: remaining })
      remaining = ''
      matched = true
      continue
    }

    // Decorators
    const decoratorMatch = remaining.match(/^@\w+/)
    if (decoratorMatch) {
      tokens.push({ type: 'decorator', value: decoratorMatch[0] })
      remaining = remaining.slice(decoratorMatch[0].length)
      matched = true
      continue
    }

    // Directive strings
    const directiveMatch = remaining.match(/^(['"]use (client|server)['"])/)
    if (directiveMatch) {
      tokens.push({ type: 'directive', value: directiveMatch[0] })
      remaining = remaining.slice(directiveMatch[0].length)
      matched = true
      continue
    }

    // Template literals
    if (remaining.startsWith('`')) {
      const endIndex = remaining.indexOf('`', 1)
      if (endIndex !== -1) {
        tokens.push({ type: 'string', value: remaining.slice(0, endIndex + 1) })
        remaining = remaining.slice(endIndex + 1)
        matched = true
        continue
      }
    }

    // Strings
    const stringMatch = remaining.match(/^(['"])(?:(?!\1).)*\1/)
    if (stringMatch) {
      tokens.push({ type: 'string', value: stringMatch[0] })
      remaining = remaining.slice(stringMatch[0].length)
      matched = true
      continue
    }

    // Numbers
    const numMatch = remaining.match(/^\d+\.?\d*/)
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[0] })
      remaining = remaining.slice(numMatch[0].length)
      matched = true
      continue
    }

    // Arrow
    if (remaining.startsWith('=>')) {
      tokens.push({ type: 'arrow', value: '=>' })
      remaining = remaining.slice(2)
      matched = true
      continue
    }

    // JSX tags
    const jsxMatch = remaining.match(/^<\/?([A-Z]\w*)/)
    if (jsxMatch) {
      tokens.push({ type: 'jsx-component', value: jsxMatch[0] })
      remaining = remaining.slice(jsxMatch[0].length)
      matched = true
      continue
    }
    const htmlMatch = remaining.match(/^<\/?([a-z]\w*)/)
    if (htmlMatch) {
      tokens.push({ type: 'jsx-tag', value: htmlMatch[0] })
      remaining = remaining.slice(htmlMatch[0].length)
      matched = true
      continue
    }

    // Words (identifiers / keywords / types)
    const wordMatch = remaining.match(/^[a-zA-Z_$]\w*/)
    if (wordMatch) {
      const word = wordMatch[0]
      let type: TokenType = 'identifier'
      if (KEYWORDS.includes(word)) {
        type = 'keyword'
      } else if (TYPES.includes(word)) {
        type = 'type'
      } else if (remaining.length > word.length && remaining[word.length] === '(') {
        type = 'function'
      }
      tokens.push({ type, value: word })
      remaining = remaining.slice(word.length)
      matched = true
      continue
    }

    // Whitespace
    const wsMatch = remaining.match(/^\s+/)
    if (wsMatch) {
      tokens.push({ type: 'plain', value: wsMatch[0] })
      remaining = remaining.slice(wsMatch[0].length)
      matched = true
      continue
    }

    // Operators and other chars
    if (!matched) {
      tokens.push({ type: 'operator', value: remaining[0] })
      remaining = remaining.slice(1)
    }
  }

  return tokens
}

export function SyntaxHighlighter({ code }: SyntaxHighlighterProps) {
  const lines = code.split('\n')

  return (
    <code className="block text-[13px] leading-relaxed">
      {lines.map((line, lineIndex) => {
        const tokens = tokenizeLine(line)
        return (
          <div key={lineIndex} className="flex">
            <span className="inline-block w-8 text-right mr-4 text-gray-600 select-none text-xs">
              {lineIndex + 1}
            </span>
            <span>
              {tokens.map((token, tokenIndex) => (
                <span key={tokenIndex} className={colorMap[token.type]}>
                  {token.value}
                </span>
              ))}
            </span>
          </div>
        )
      })}
    </code>
  )
}
