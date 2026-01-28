"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.message = {
    prefer: 'Prefer transform pipe `ParseIntPipe` in @Param decorator',
    transformed: 'Redundant coercing to number, parameter `{{name}}` must be a number',
};
exports.parseIntPipe = {
    create(context) {
        const parameters = [];
        const checkAndReport = (argument) => {
            const param = parameters.find(p => p.name === argument.name);
            if (!param) {
                return;
            }
            if (param.decorator.transformed) {
                context.report(argument, exports.message.transformed, { name: param.name });
            }
            else {
                context.report(argument, exports.message.prefer);
            }
        };
        return {
            CallExpression: (node) => {
                if (isCoercingToNumber(node)) {
                    const [argument] = node.arguments;
                    checkAndReport(argument);
                }
            },
            UnaryExpression: (node) => {
                if (isCoercingToNumber(node)) {
                    checkAndReport(node.argument);
                }
            },
            FunctionExpression: (node) => {
                if (!Array.isArray(node.params)) {
                    return;
                }
                node.params
                    .map(param => ({ param, decorator: getDecorator(param) }))
                    .filter(x => x.decorator)
                    .forEach(({ param, decorator }) => {
                    parameters.push({ name: param.name, decorator });
                });
            }
        };
    }
};
function getDecorator(node) {
    // const decorator = (node.decorators || []).find(d => d.expression && d.expression.callee && d.expression.callee.name === 'Param');
    const decorator = utils_1.getDecoratorByName(node, 'Param');
    if (!decorator) {
        return;
    }
    const [, expr] = decorator.expression.arguments;
    return {
        transformed: Boolean(expr && expr.type === 'NewExpression' && expr.callee && expr.callee.type === 'Identifier' && expr.callee.name === 'ParseIntPipe'),
    };
}
function isCoercingToNumber(node) {
    if (node.callee) {
        if (node.callee.name === 'parseInt') {
            // const [, radix] = node.arguments;
            // if (radix && radix.type === 'Literal' && radix.value !== 10) {
            //     return false;
            // }
            return true;
        }
        if (node.callee.name === 'Number') {
            return true;
        }
        if (node.callee.object && node.callee.object.name === 'Number' && node.callee.property.name === 'parseInt') {
            return true;
        }
    }
    if (node.operator === '+' && node.prefix === true) {
        return true;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtaW50LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGFyc2UtaW50LXBpcGUvcGFyc2UtaW50LXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvQ0FBOEM7QUFHakMsUUFBQSxPQUFPLEdBQUc7SUFDbkIsTUFBTSxFQUFFLDBEQUEwRDtJQUNsRSxXQUFXLEVBQUUscUVBQXFFO0NBQ3JGLENBQUM7QUFFVyxRQUFBLFlBQVksR0FBRztJQUN4QixNQUFNLENBQUMsT0FBTztRQUNWLE1BQU0sVUFBVSxHQUE0QyxFQUFFLENBQUM7UUFDL0QsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNoQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNULE1BQU0sQ0FBQztZQUNYLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGVBQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGVBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBQ0YsTUFBTSxDQUFDO1lBQ0gsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDM0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ2xDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNMLENBQUM7WUFDRCxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDdEIsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzQixjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO1lBQ0wsQ0FBQztZQUNELGtCQUFrQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUM7Z0JBQ1gsQ0FBQztnQkFDQSxJQUFJLENBQUMsTUFBZ0I7cUJBQ2pCLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7cUJBQ3pELE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7cUJBQ3hCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7b0JBQzlCLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRCxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7U0FDSixDQUFDO0lBQ04sQ0FBQztDQUNKLENBQUM7QUFFRixzQkFBc0IsSUFBSTtJQUN0QixvSUFBb0k7SUFDcEksTUFBTSxTQUFTLEdBQUcsMEJBQWtCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3BELEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNiLE1BQU0sQ0FBQztJQUNYLENBQUM7SUFDRCxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBSSxTQUFTLENBQUMsVUFBNkIsQ0FBQyxTQUFTLENBQUM7SUFDcEUsTUFBTSxDQUFDO1FBQ0gsV0FBVyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxlQUFlLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxZQUFZLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssY0FBYyxDQUFDO0tBQ3pKLENBQUM7QUFDTixDQUFDO0FBRUQsNEJBQTRCLElBQXVFO0lBQy9GLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNsQyxvQ0FBb0M7WUFDcEMsaUVBQWlFO1lBQ2pFLG9CQUFvQjtZQUNwQixJQUFJO1lBQ0osTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDIn0=