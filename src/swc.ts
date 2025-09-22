import * as swc from '@swc/core'
import { compressKey } from './compressKey'
import { mergeDefaultOptions, Options } from './options'
import { astToKey, UnsupportedAstTypeError } from './astToKey'

export interface SwcTransformOptions extends Partial<Options> {
  filename?: string
}

// We keep a set of processed nodes, because SWC may traverse the same node twice,
// which would cause us to compress the key twice.
const processedNodes = new Set()

// Transform function that uses SWC to parse and transform code
export async function transformCode(
  code: string,
  options: SwcTransformOptions = {}
): Promise<string> {
  // Do not process any files in development
  if (process.env.NODE_ENV === 'development') {
    return code
  }

  // Do not process any files in `node_modules/`
  if (options.filename && options.filename.includes('/node_modules/')) {
    return code
  }

  const mergedOptions = mergeDefaultOptions(options)

  try {
    // Clear processed nodes for each file
    processedNodes.clear()

    // Parse the code into an AST
    const ast = await swc.parse(code, {
      syntax: 'typescript',
      tsx: true,
      decorators: false,
      dynamicImport: false,
    })

    // Transform the AST
    const transformedAst = transformAst(ast, code, mergedOptions)

    // Generate code from the transformed AST
    const result = await swc.print(transformedAst)
    return result.code
  } catch (error) {
    // Re-throw UnsupportedAstTypeError to let tests catch it
    if (error instanceof UnsupportedAstTypeError) {
      throw error
    }
    // If transformation fails, return original code
    console.warn('SWC transformation failed:', error)
    return code
  }
}

function transformAst(
  ast: swc.Program,
  sourceCode: string,
  options: Required<Options>
): swc.Program {
  function visitNode(node: any): any {
    if (!node || typeof node !== 'object') {
      return node
    }

    // Handle CallExpression for t() function calls
    if (node.type === 'CallExpression') {
      node = visitCallExpression(node, sourceCode, options)
    }

    // Handle JSXElement for <Trans> components
    if (node.type === 'JSXElement') {
      node = visitJSXElement(node, sourceCode, options)
    }

    // Recursively visit all properties
    for (const key in node) {
      if (node.hasOwnProperty(key) && node[key] !== null && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key] = node[key].map(visitNode)
        } else {
          node[key] = visitNode(node[key])
        }
      }
    }

    return node
  }

  return visitNode(ast)
}

function visitCallExpression(node: any, sourceCode: string, options: Required<Options>): any {
  // Skip if already processed
  if (processedNodes.has(node)) {
    return node
  }

  // Only handle functions with the name `t` and at least one argument
  if (
    !node.callee ||
    node.callee.type !== 'Identifier' ||
    node.callee.value !== 't' ||
    !node.arguments ||
    node.arguments.length === 0
  ) {
    return node
  }

  try {
    // Get the key from the AST of the first argument
    const firstArg = node.arguments[0]
    if (!firstArg || !firstArg.expression) {
      return node
    }

    const babelAstNode = convertSwcToBabelAst(firstArg.expression)
    const key = astToKey([babelAstNode], {
      code: sourceCode,
    })

    // Replace the first argument with compressed key
    const compressedKey = compressKey(key, options.hashLength)
    node.arguments[0] = {
      spread: null,
      expression: {
        type: 'StringLiteral',
        value: compressedKey,
        span: firstArg.expression.span || { start: 0, end: 0, ctxt: 0 },
      },
    }

    processedNodes.add(node)
  } catch (error) {
    // Re-throw UnsupportedAstTypeError to let tests catch it
    if (error instanceof UnsupportedAstTypeError) {
      throw error
    }
    // For other errors, just log and continue
    console.warn('Failed to process call expression:', error)
  }

  return node
}

function visitJSXElement(node: any, sourceCode: string, options: Required<Options>): any {
  // Skip if already processed
  if (processedNodes.has(node)) {
    return node
  }

  // Only handle JSX elements with the name `Trans`
  if (
    !node.opening ||
    !node.opening.name ||
    node.opening.name.type !== 'Identifier' ||
    node.opening.name.value !== 'Trans'
  ) {
    return node
  }

  try {
    // We don't support cases where a variable is spread into the attributes
    const spreadAttribute = node.opening.attributes?.find((x: any) => x.type === 'SpreadElement')
    if (spreadAttribute) {
      throw new UnsupportedAstTypeError(spreadAttribute, sourceCode)
    }

    // Get the content of the `i18nKey` attribute, if it exists and has a value
    let i18nKeyAttributeValue
    const i18nKeyAttribute = node.opening.attributes?.find(
      (x: any) =>
        x.type === 'JSXAttribute' && x.name?.type === 'Identifier' && x.name?.value === 'i18nKey'
    )
    if (i18nKeyAttribute && i18nKeyAttribute.value) {
      const babelAstNode = convertSwcToBabelAst(i18nKeyAttribute.value)
      i18nKeyAttributeValue = astToKey([babelAstNode], {
        code: sourceCode,
      })
    }

    // Get the key based on the children, if they exist
    let childrenKey = ''
    if (node.children && node.children.length > 0) {
      const babelAstNodes = node.children.map((child: any) => convertSwcToBabelAst(child))
      childrenKey = astToKey(babelAstNodes, {
        code: sourceCode,
        jsx: true,
      })
    }

    // The key is either the `i18nKey` attribute or the child text node
    const key = i18nKeyAttributeValue || childrenKey
    const compressedKey = compressKey(key, options.hashLength)

    // Create new i18nKey attribute
    const i18nKeyAttr = {
      type: 'JSXAttribute',
      name: {
        type: 'Identifier',
        value: 'i18nKey',
        optional: false,
        span: { start: 0, end: 0, ctxt: 0 },
      },
      value: {
        type: 'StringLiteral',
        value: compressedKey,
        span: { start: 0, end: 0, ctxt: 0 },
      },
      span: { start: 0, end: 0, ctxt: 0 },
    }

    // Initialize attributes array if it doesn't exist
    if (!node.opening.attributes) {
      node.opening.attributes = []
    }

    // Remove existing i18nKey attribute if present
    node.opening.attributes = node.opening.attributes.filter(
      (attr: any) =>
        !(
          attr.type === 'JSXAttribute' &&
          attr.name?.type === 'Identifier' &&
          attr.name?.value === 'i18nKey'
        )
    )

    // Add the new i18nKey attribute
    node.opening.attributes.push(i18nKeyAttr)

    // Check if we can turn this into a self-closing element
    const canTurnIntoSelfClosing = node.children?.every(
      (childNode: any) => childNode.type === 'JSXText'
    )

    if (canTurnIntoSelfClosing) {
      // Turn it into a self-closing element
      node.children = []
      node.closing = undefined
      node.opening.selfClosing = true
    } else {
      // Compress the text nodes to single characters
      compressChildTextNodes(node.children || [])
    }

    processedNodes.add(node)
  } catch (error) {
    // Re-throw UnsupportedAstTypeError to let tests catch it
    if (error instanceof UnsupportedAstTypeError) {
      throw error
    }
    // For other errors, just log and continue
    console.warn('Failed to process JSX element:', error)
  }

  return node
}

function compressChildTextNodes(children: any[]): void {
  for (let i = 0; i !== children.length; i++) {
    const child = children[i]

    if (child.type === 'JSXElement') {
      compressChildTextNodes(child.children || [])
      continue
    }

    // We ignore empty text nodes since they get stripped by React
    if (child.type === 'JSXText' && child.value?.trim() !== '') {
      child.value = '~'
      continue
    }
  }
}

// Convert SWC AST nodes to Babel-like AST nodes for compatibility with existing astToKey function
function convertSwcToBabelAst(node: any): any {
  if (!node) return node

  switch (node.type) {
    case 'StringLiteral':
      return {
        type: 'StringLiteral',
        value: node.value,
        start: node.span?.start,
        end: node.span?.end,
      }

    case 'TemplateLiteral':
      return {
        type: 'TemplateLiteral',
        quasis: node.quasis?.map((quasi: any) => ({
          type: 'TemplateElement',
          value: {
            raw: quasi.raw,
            cooked: quasi.cooked,
          },
          tail: quasi.tail,
        })),
        expressions: node.expressions?.map((expr: any) => convertSwcToBabelAst(expr)),
      }

    case 'Identifier':
      return {
        type: 'Identifier',
        name: node.value || node.sym, // Handle both value and sym properties
        start: node.span?.start,
        end: node.span?.end,
      }

    case 'JSXText':
      return {
        type: 'JSXText',
        value: node.value,
      }

    case 'JSXElement':
      return {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: convertSwcToBabelAst(node.opening?.name),
          attributes: node.opening?.attributes?.map((attr: any) => convertSwcToBabelAst(attr)),
          selfClosing: node.opening?.selfClosing,
        },
        closingElement: node.closing
          ? {
              type: 'JSXClosingElement',
              name: convertSwcToBabelAst(node.closing.name),
            }
          : null,
        children: node.children?.map((child: any) => convertSwcToBabelAst(child)),
      }

    case 'JSXExpressionContainer':
      return {
        type: 'JSXExpressionContainer',
        expression: convertSwcToBabelAst(node.expression),
      }

    case 'JSXAttribute':
      return {
        type: 'JSXAttribute',
        name: convertSwcToBabelAst(node.name),
        value: node.value ? convertSwcToBabelAst(node.value) : null,
      }

    case 'BinaryExpression':
      return {
        type: 'BinaryExpression',
        left: convertSwcToBabelAst(node.left),
        operator: node.op,
        right: convertSwcToBabelAst(node.right),
      }

    case 'MemberExpression':
      return {
        type: 'MemberExpression',
        object: convertSwcToBabelAst(node.object),
        property: convertSwcToBabelAst(node.property),
        computed: node.computed,
      }

    case 'CallExpression':
      return {
        type: 'CallExpression',
        callee: convertSwcToBabelAst(node.callee),
        arguments: node.arguments?.map((arg: any) => convertSwcToBabelAst(arg.expression || arg)),
      }

    case 'NumericLiteral':
    case 'NumberLiteral':
      return {
        type: 'NumericLiteral',
        value: node.value,
      }

    case 'BooleanLiteral':
      return {
        type: 'BooleanLiteral',
        value: node.value,
      }

    case 'NullLiteral':
      return {
        type: 'NullLiteral',
      }

    case 'ObjectExpression':
      return {
        type: 'ObjectExpression',
        properties: node.properties?.map((prop: any) => convertSwcToBabelAst(prop)),
        start: node.span?.start,
        end: node.span?.end,
      }

    case 'ObjectProperty':
    case 'Property':
      return {
        type: 'ObjectProperty',
        key: convertSwcToBabelAst(node.key),
        value: convertSwcToBabelAst(node.value),
        computed: node.computed,
        shorthand: node.shorthand,
      }

    default:
      // For unsupported types, try to preserve the structure
      console.warn(`Unhandled SWC AST node type: ${node.type}`)
      return {
        type: node.type,
        start: node.span?.start,
        end: node.span?.end,
        ...node,
      }
  }
}
