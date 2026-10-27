import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { Box, Button, Collapse } from "@mui/material";
import { useEffect, useId, useMemo, useState } from "react";

type ExampleCodeBlockProps = Readonly<{
  code: string;
  defaultExpanded?: boolean;
  hideLabel: string;
  languageLabel: string;
  showLabel: string;
}>;

type CodeTokenKind =
  | "attribute"
  | "comment"
  | "component"
  | "function"
  | "keyword"
  | "literal"
  | "operator"
  | "plain"
  | "property"
  | "string"
  | "type";

type CodeToken = Readonly<{
  kind: CodeTokenKind;
  value: string;
}>;

const codeTokenPattern =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\[\s\S]|[^\\`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|<\/|\/>|===|!==|=>|==|!=|<=|>=|&&|\|\||\?\?|[A-Za-z_$][\w$]*|\d(?:[\d_]*\.?[\d_]*)|[{}()[\].,:;=<>!?+\-*/]|\s+|.)/g;

const codeKeywords = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "of",
  "return",
  "satisfies",
  "switch",
  "throw",
  "try",
  "type",
  "typeof",
  "var",
  "while",
  "yield",
]);

const codeLiterals = new Set(["false", "null", "true", "undefined"]);

function significantToken(tokens: readonly string[], startIndex: number, direction: -1 | 1): string | undefined {
  for (let index = startIndex; index >= 0 && index < tokens.length; index += direction) {
    if (!/^\s+$/.test(tokens[index] ?? "")) return tokens[index];
  }
  return undefined;
}

function tokenKind(
  token: string,
  tokens: readonly string[],
  index: number,
  jsxState: Readonly<{
    expectTagName: boolean;
    expressionDepth: number;
    inTag: boolean;
  }>,
): CodeTokenKind {
  if (token.startsWith("//") || token.startsWith("/*")) return "comment";
  if (/^[`'"]/.test(token)) return "string";
  if (/^\d/.test(token) || codeLiterals.has(token)) return "literal";
  if (codeKeywords.has(token)) return "keyword";
  if (!/^[A-Za-z_$]/.test(token)) return /^\s+$/.test(token) ? "plain" : "operator";
  if (jsxState.expectTagName) return "component";
  if (jsxState.inTag && jsxState.expressionDepth === 0) return "attribute";

  const previous = significantToken(tokens, index - 1, -1);
  const next = significantToken(tokens, index + 1, 1);

  if (previous === ".") return "property";
  if (/^[A-Z]/.test(token)) return "type";
  if (next === "(") return "function";
  return "plain";
}

function tokenizedCodeLines(code: string): readonly (readonly CodeToken[])[] {
  const rawTokens = Array.from(code.matchAll(codeTokenPattern), match => match[0]);
  const lines: CodeToken[][] = [[]];
  let expectTagName = false;
  let expressionDepth = 0;
  let inTag = false;

  rawTokens.forEach((token, index) => {
    if (token === "</") {
      expectTagName = true;
      expressionDepth = 0;
      inTag = true;
    } else if (token === "<") {
      const previous = significantToken(rawTokens, index - 1, -1);
      const next = significantToken(rawTokens, index + 1, 1);
      const startsJsx =
        next !== undefined &&
        /^[A-Za-z_$]/.test(next) &&
        (previous === undefined || ["(", "[", "{", "=", ":", ",", "=>", ";", "return", ">"].includes(previous));

      if (startsJsx) {
        expectTagName = true;
        expressionDepth = 0;
        inTag = true;
      }
    }

    const kind = tokenKind(token, rawTokens, index, {
      expectTagName,
      expressionDepth,
      inTag,
    });

    token.split("\n").forEach((part, partIndex) => {
      if (partIndex > 0) lines.push([]);
      if (part !== "") lines.at(-1)?.push({ kind, value: part });
    });

    if (expectTagName && /^[A-Za-z_$]/.test(token)) expectTagName = false;
    if (inTag && token === "{") expressionDepth += 1;
    if (inTag && token === "}" && expressionDepth > 0) expressionDepth -= 1;
    if (inTag && expressionDepth === 0 && (token === ">" || token === "/>")) {
      inTag = false;
    }
  });

  return lines;
}

function tokenColor(kind: CodeTokenKind): string | undefined {
  if (kind === "attribute" || kind === "property") return "info.main";
  if (kind === "component" || kind === "type") return "secondary.main";
  if (kind === "function") return "warning.main";
  if (kind === "keyword") return "primary.main";
  if (kind === "literal") return "error.main";
  if (kind === "operator" || kind === "comment") return "text.secondary";
  if (kind === "string") return "success.main";
  return undefined;
}

function HighlightedLine({ tokens }: Readonly<{ tokens: readonly CodeToken[] }>) {
  return tokens.map((token, index) => (
    <Box
      component="span"
      data-code-token={token.kind === "plain" ? undefined : token.kind}
      key={`${index}-${token.value}`}
      sx={{
        color: tokenColor(token.kind),
        fontStyle: token.kind === "comment" ? "italic" : undefined,
      }}
    >
      {token.value}
    </Box>
  ));
}

async function formatExampleCode(code: string): Promise<string> {
  try {
    const [{ format }, { default: babelPlugin }, { default: estreePlugin }] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]);

    return (
      await format(code.trim(), {
        parser: "babel-ts",
        plugins: [babelPlugin, estreePlugin],
        semi: true,
        singleQuote: true,
      })
    ).trimEnd();
  } catch {
    return code.trim();
  }
}

/** Shows a compact, Prettier-formatted TSX excerpt with an accessible toggle. */
export function ExampleCodeBlock({
  code,
  defaultExpanded = false,
  hideLabel,
  languageLabel,
  showLabel,
}: ExampleCodeBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [formattedCode, setFormattedCode] = useState<string | undefined>(() =>
    defaultExpanded ? code.trim() : undefined,
  );
  const [formatting, setFormatting] = useState(false);
  const codeId = useId();
  const lines = useMemo(() => tokenizedCodeLines(formattedCode ?? ""), [formattedCode]);

  useEffect(() => {
    if (!defaultExpanded) return;

    let active = true;
    void formatExampleCode(code).then(formatted => {
      if (!active) return;
      setFormattedCode(formatted);
    });

    return () => {
      active = false;
    };
  }, [code, defaultExpanded]);

  const toggleCode = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (formattedCode !== undefined) {
      setExpanded(true);
      return;
    }
    if (formatting) return;

    setFormatting(true);
    void formatExampleCode(code).then(formatted => {
      setFormattedCode(formatted);
      setFormatting(false);
      setExpanded(true);
    });
  };

  return (
    <Box
      sx={theme => ({
        borderTop: "1px solid",
        borderTopColor: "divider",
        ...theme.applyStyles("dark", {
          borderTopColor: "rgba(255, 255, 255, 0.14)",
        }),
      })}
    >
      <Button
        aria-busy={formatting}
        aria-controls={expanded ? codeId : undefined}
        aria-expanded={expanded}
        color="inherit"
        disabled={formatting}
        endIcon={
          <ExpandMoreOutlinedIcon
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: theme =>
                theme.transitions.create("transform", {
                  duration: theme.transitions.duration.shortest,
                }),
            }}
          />
        }
        fullWidth
        onClick={toggleCode}
        startIcon={<CodeOutlinedIcon />}
        sx={{
          bgcolor: "background.paper",
          borderRadius: 0,
          color: "text.secondary",
          justifyContent: "flex-start",
          px: 2.5,
          py: 1.5,
          "& .MuiButton-endIcon": { ml: "auto" },
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {expanded ? hideLabel : showLabel}
      </Button>
      <Collapse appear={false} in={expanded} timeout="auto" unmountOnExit>
        <Box
          id={codeId}
          sx={theme => ({
            bgcolor: "background.default",
            color: "text.primary",
            overflow: "hidden",
            ...theme.applyStyles("light", {
              bgcolor: "background.paper",
            }),
          })}
        >
          <Box
            aria-label={languageLabel}
            component="pre"
            tabIndex={0}
            sx={{
              direction: "ltr",
              fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
              fontSize: "0.75rem",
              lineHeight: 1.7,
              m: 0,
              overflowX: "auto",
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: "-2px",
              },
              p: 2,
              tabSize: 2,
              textAlign: "left",
            }}
          >
            {lines.map((tokens, index) => (
              <Box
                component="code"
                key={index}
                sx={{
                  display: "block",
                  font: "inherit",
                  minHeight: "1.7em",
                }}
              >
                <HighlightedLine tokens={tokens} />
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
