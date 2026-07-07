type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const trailingPunctuation = /^([.,;:!?)\]\u2019\u201d]+)(?=\s|$)/;

function classList(node: HastNode): string[] {
  const value = node.properties?.className;

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    return value.split(/\s+/);
  }

  return [];
}

function hasClass(node: HastNode, className: string): boolean {
  return classList(node).includes(className);
}

function isElement(node: HastNode): boolean {
  return node.type === "element";
}

function isInlineKatex(node: HastNode): boolean {
  return isElement(node) && hasClass(node, "katex");
}

function isText(node: HastNode): node is HastNode & { value: string } {
  return node.type === "text" && typeof node.value === "string";
}

function visit(
  node: HastNode,
  insideDisplayMath = false,
  insideMathNoWrap = false,
): void {
  const isDisplayMath =
    isElement(node) && hasClass(node, "katex-display");
  const isMathNoWrap = isElement(node) && hasClass(node, "math-nowrap");
  const nextInsideDisplayMath = insideDisplayMath || isDisplayMath;
  const nextInsideMathNoWrap = insideMathNoWrap || isMathNoWrap;
  const children = node.children;

  if (!children) {
    return;
  }

  for (let index = 0; index < children.length - 1; index += 1) {
    const current = children[index];
    const next = children[index + 1];

    if (
      nextInsideDisplayMath ||
      nextInsideMathNoWrap ||
      !isInlineKatex(current) ||
      !isText(next)
    ) {
      continue;
    }

    const match = next.value?.match(trailingPunctuation);
    if (!match) {
      continue;
    }

    const punctuation = match[1];
    const rest = next.value.slice(punctuation.length);

    children[index] = {
      type: "element",
      tagName: "span",
      properties: { className: ["math-nowrap"] },
      children: [current, { type: "text", value: punctuation }],
    };

    if (rest.length === 0) {
      children.splice(index + 1, 1);
    } else {
      next.value = rest;
    }
  }

  for (const child of children) {
    visit(child, nextInsideDisplayMath, nextInsideMathNoWrap);
  }
}

export default function rehypeNoOrphanMathPunctuation() {
  return (tree: HastNode) => {
    visit(tree);
  };
}
