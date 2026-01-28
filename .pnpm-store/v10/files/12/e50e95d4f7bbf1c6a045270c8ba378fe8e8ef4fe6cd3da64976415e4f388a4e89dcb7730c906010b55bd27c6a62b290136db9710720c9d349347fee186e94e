"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getDecoratorByName(node, name) {
    const result = (node.decorators || []).find(d => {
        const expression = d.expression && d.expression.type === 'CallExpression' && d.expression;
        return expression && expression.callee.type === 'Identifier' && expression.callee.name === name;
    });
    return result;
}
exports.getDecoratorByName = getDecoratorByName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSw0QkFBbUMsSUFBUyxFQUFFLElBQVk7SUFDdEQsTUFBTSxNQUFNLEdBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUN2RCxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxVQUE0QixDQUFDO1FBQzVHLE1BQU0sQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssWUFBWSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQztJQUNwRyxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQU5ELGdEQU1DIn0=