"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.message = 'Use pipe `ValidationPipe` for data validation';
exports.useValidationPipe = {
    create(context) {
        let validationPipeInClass = false;
        return {
            ClassDeclaration: (node) => {
                const classUsePipes = utils_1.getDecoratorByName(node, 'UsePipes');
                validationPipeInClass = hasExprValidationPipe(classUsePipes);
            },
            'ClassDeclaration:exit': () => {
                validationPipeInClass = false;
            },
            MethodDefinition: (node) => {
                if (validationPipeInClass) {
                    return;
                }
                const param = node.value.params.find(p => utils_1.getDecoratorByName(p, 'Body') !== undefined);
                if (!param) {
                    return;
                }
                const body = utils_1.getDecoratorByName(param, 'Body');
                if (hasExprValidationPipe(body)) {
                    return;
                }
                const usePipes = utils_1.getDecoratorByName(node, 'UsePipes');
                if (hasExprValidationPipe(usePipes)) {
                    return;
                }
                const { typeAnnotation } = param;
                if (typeAnnotation && typeAnnotation.typeAnnotation && ['GenericTypeAnnotation', 'TSTypeReference'].includes(typeAnnotation.typeAnnotation.type)) {
                    context.report({ node: param, message: exports.message });
                }
            },
        };
    }
};
function hasExprValidationPipe(node) {
    if (!node) {
        return false;
    }
    return node.expression.arguments
        .some(argument => {
        return (argument.type === 'NewExpression' && argument.callee.type === 'Identifier' && argument.callee.name === 'ValidationPipe')
            || (argument.type === 'Identifier' && argument.name === 'ValidationPipe');
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlLXZhbGlkYXRpb24tcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91c2UtdmFsaWRhdGlvbi1waXBlL3VzZS12YWxpZGF0aW9uLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvQ0FBOEM7QUFHakMsUUFBQSxPQUFPLEdBQUcsK0NBQStDLENBQUM7QUFFMUQsUUFBQSxpQkFBaUIsR0FBRztJQUM3QixNQUFNLENBQUMsT0FBTztRQUNWLElBQUkscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQztZQUNILGdCQUFnQixFQUFFLENBQUMsSUFBc0IsRUFBRSxFQUFFO2dCQUN6QyxNQUFNLGFBQWEsR0FBRywwQkFBa0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzNELHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7Z0JBQzFCLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUNsQyxDQUFDO1lBQ0QsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFzQixFQUFFLEVBQUU7Z0JBQ3pDLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztvQkFDeEIsTUFBTSxDQUFDO2dCQUNYLENBQUM7Z0JBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsMEJBQWtCLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO2dCQUN2RixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ1QsTUFBTSxDQUFDO2dCQUNYLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEdBQUcsMEJBQWtCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQyxFQUFFLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQztnQkFDWCxDQUFDO2dCQUNELE1BQU0sUUFBUSxHQUFHLDBCQUFrQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDdEQsRUFBRSxDQUFDLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxNQUFNLENBQUM7Z0JBQ1gsQ0FBQztnQkFDRCxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsS0FBWSxDQUFDO2dCQUN4QyxFQUFFLENBQUMsQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLGNBQWMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLGlCQUFpQixDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvSSxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQVAsZUFBTyxFQUFFLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztZQUNMLENBQUM7U0FDSixDQUFDO0lBQ04sQ0FBQztDQUNKLENBQUM7QUFFRiwrQkFBK0IsSUFBSTtJQUMvQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDUixNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxNQUFNLENBQUUsSUFBSSxDQUFDLFVBQTZCLENBQUMsU0FBUztTQUMvQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDYixNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLGVBQWUsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxZQUFZLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUM7ZUFDekgsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLFlBQVksSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLGdCQUFnQixDQUFDLENBQUM7SUFDbEYsQ0FBQyxDQUFDLENBQUM7QUFDWCxDQUFDIn0=