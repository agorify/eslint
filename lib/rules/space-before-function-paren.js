/**
 * @fileoverview Rule to validate spacing before function paren.
 * @author Mathias Schreck <https://github.com/lo1tuma>
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "enforce consistent spacing before `function` definition opening parenthesis",
            category: "Stylistic Issues",
            recommended: false
        },

        fixable: "whitespace",

        schema: [
            {
                oneOf: [
                    {
                        enum: ["always", "never"]
                    },
                    {
                        type: "object",
                        properties: {
                            anonymous: {
                                enum: ["always", "never", "ignore"]
                            },
                            named: {
                                enum: ["always", "never", "ignore"]
                            }
                        },
                        additionalProperties: false
                    }
                ]
            }
        ]
    },

    create(context) {

        const configuration = context.options[0],
            sourceCode = context.getSourceCode();
        let requireAnonymousFunctionSpacing = true,
            forbidAnonymousFunctionSpacing = false,
            requireNamedFunctionSpacing = true,
            forbidNamedFunctionSpacing = false;

        if (typeof configuration === "object") {
            requireAnonymousFunctionSpacing = (
                !configuration.anonymous || configuration.anonymous === "always");
            forbidAnonymousFunctionSpacing = configuration.anonymous === "never";
            requireNamedFunctionSpacing = (
                !configuration.named || configuration.named === "always");
            forbidNamedFunctionSpacing = configuration.named === "never";
        } else if (configuration === "never") {
            requireAnonymousFunctionSpacing = false;
            forbidAnonymousFunctionSpacing = true;
            requireNamedFunctionSpacing = false;
            forbidNamedFunctionSpacing = true;
        }

        /**
         * Determines whether a function has a name.
         * @param {ASTNode} node The function node.
         * @returns {boolean} Whether the function has a name.
         */
        function isNamedFunction(node) {
            if (node.id) {
                return true;
            }

            const parent = node.parent;

            return parent.type === "MethodDefinition" ||
                (parent.type === "Property" &&
                    (
                        parent.kind === "get" ||
                        parent.kind === "set" ||
                        parent.method
                    )
                );
        }

        /**
         * Validates the spacing before function parentheses.
         * @param {ASTNode} node The node to be validated.
         * @returns {void}
         */
        function validateSpacingBeforeParentheses(node) {
            const isNamed = isNamedFunction(node);
            let rightToken;

            if (node.generator && !isNamed) {
                return;
            }

            rightToken = sourceCode.getFirstToken(node);
            while (rightToken.value !== "(") {
                rightToken = sourceCode.getTokenAfter(rightToken);
            }
            const leftToken = sourceCode.getTokenBefore(rightToken);
            const location = leftToken.loc.end;

            if (sourceCode.isSpaceBetweenTokens(leftToken, rightToken)) {
                if ((isNamed && forbidNamedFunctionSpacing) || (!isNamed && forbidAnonymousFunctionSpacing)) {
                    context.report({
                        node,
                        loc: location,
                        message: "Unexpected space before function parentheses.",
                        fix(fixer) {
                            return fixer.removeRange([leftToken.range[1], rightToken.range[0]]);
                        }
                    });
                }
            } else {
                if ((isNamed && requireNamedFunctionSpacing) || (!isNamed && requireAnonymousFunctionSpacing)) {
                    context.report({
                        node,
                        loc: location,
                        message: "Missing space before function parentheses.",
                        fix(fixer) {
                            return fixer.insertTextAfter(leftToken, " ");
                        }
                    });
                }
            }
        }

        return {
            FunctionDeclaration: validateSpacingBeforeParentheses,
            FunctionExpression: validateSpacingBeforeParentheses
        };
    }
};
