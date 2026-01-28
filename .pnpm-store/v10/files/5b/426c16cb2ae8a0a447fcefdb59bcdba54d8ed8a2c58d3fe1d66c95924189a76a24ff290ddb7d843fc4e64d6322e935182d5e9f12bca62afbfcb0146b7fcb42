"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = 'Dependency must be provided through a class constructor';
exports.useDependencyInjection = {
    create(context) {
        let constructor = null;
        let isInjectable = false;
        const imports = [];
        const isIdentifierFromImports = (name) => {
            return Boolean(imports.find(x => x.name === name));
        };
        return {
            Program: (node) => {
                node.body
                    .filter(node => node.type === 'VariableDeclaration')
                    .map(node => node.declarations)
                    .reduce((acc, value) => acc.concat(value), [])
                    .forEach(node => {
                    imports.push({ name: node.id.name });
                });
            },
            ImportDeclaration: (node) => {
                node.specifiers
                    .map(specifier => specifier.local && specifier.local.name)
                    .filter(Boolean)
                    .forEach(name => {
                    imports.push({ name });
                });
            },
            TSImportEqualsDeclaration: (node) => {
                const name = node.name.name;
                imports.push({ name });
            },
            ClassDeclaration: (node) => {
                if (isClassInjectable(node)) {
                    isInjectable = true;
                }
            },
            'ClassDeclaration:exit': () => {
                isInjectable = false;
            },
            MethodDefinition: (node) => {
                if (isConstructor(node)) {
                    constructor = node;
                }
            },
            'MethodDefinition:exit': () => {
                constructor = null;
            },
            AssignmentExpression: (node) => {
                if (isInjectable && constructor && isThisMemberNewExpression(node)) {
                    context.report({ node: node.right, message: exports.message });
                }
            },
            ClassProperty: (node) => {
                if (!isInjectable || !node.value) {
                    return;
                }
                const nodeValue = node.value;
                if (isNewExpression(nodeValue)
                    || isRequireCall(nodeValue)
                    || isIdentifierFromImports(nodeValue.name)) {
                    context.report({ node: nodeValue, message: exports.message });
                }
            }
        };
    }
};
function isRequireCall(node) {
    return node && node.callee && node.callee.name === 'require';
}
function isNewExpression(node) {
    return node && node.type === 'NewExpression';
}
function isConstructor(node) {
    return node.key && node.key.name === 'constructor';
}
function isThisMemberNewExpression(node) {
    return node.operator === '=' && node.left && node.left.type === 'MemberExpression' && isNewExpression(node.right);
}
const isClassInjectable = (() => {
    const injectDecoratorNames = ['Component'];
    return (node) => {
        return (node.decorators || []).find(d => d.expression && d.expression.callee && d.expression.callee.name && injectDecoratorNames.includes(d.expression.callee.name));
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlLWRlcGVuZGVuY3ktaW5qZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3VzZS1kZXBlbmRlbmN5LWluamVjdGlvbi91c2UtZGVwZW5kZW5jeS1pbmplY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBYSxRQUFBLE9BQU8sR0FBRyx5REFBeUQsQ0FBQztBQUNwRSxRQUFBLHNCQUFzQixHQUFHO0lBQ2xDLE1BQU0sQ0FBQyxPQUFPO1FBQ1YsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztRQUN6QixNQUFNLE9BQU8sR0FBVSxFQUFFLENBQUM7UUFDMUIsTUFBTSx1QkFBdUIsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFO1lBQzdDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUM7UUFDRixNQUFNLENBQUM7WUFDSCxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDYixJQUFJLENBQUMsSUFBYztxQkFDZixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLHFCQUFxQixDQUFDO3FCQUNuRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO3FCQUM5QixNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQztxQkFDN0MsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN6QyxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7WUFDRCxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN2QixJQUFJLENBQUMsVUFBb0I7cUJBQ3JCLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7cUJBQ3pELE1BQU0sQ0FBQyxPQUFPLENBQUM7cUJBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQixDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7WUFDRCx5QkFBeUIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNoQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUNELGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3ZCLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsWUFBWSxHQUFHLElBQUksQ0FBQztnQkFDeEIsQ0FBQztZQUNMLENBQUM7WUFDRCx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7Z0JBQzFCLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDekIsQ0FBQztZQUNELGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ3ZCLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLFdBQVcsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLENBQUM7WUFDTCxDQUFDO1lBQ0QsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO2dCQUMxQixXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxvQkFBb0IsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUMzQixFQUFFLENBQUMsQ0FBQyxZQUFZLElBQUksV0FBVyxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBUCxlQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO1lBQ0wsQ0FBQztZQUNELGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNwQixFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMvQixNQUFNLENBQUM7Z0JBQ1gsQ0FBQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUM3QixFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDO3VCQUN2QixhQUFhLENBQUMsU0FBUyxDQUFDO3VCQUN4Qix1QkFBdUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUM3QyxDQUFDLENBQUMsQ0FBQztvQkFDQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQVAsZUFBTyxFQUFFLENBQUMsQ0FBQztnQkFDakQsQ0FBQztZQUNMLENBQUM7U0FDSixDQUFDO0lBQ04sQ0FBQztDQUNKLENBQUM7QUFFRix1QkFBdUIsSUFBSTtJQUN2QixNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO0FBQ2pFLENBQUM7QUFFRCx5QkFBeUIsSUFBSTtJQUN6QixNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssZUFBZSxDQUFDO0FBQ2pELENBQUM7QUFFRCx1QkFBdUIsSUFBSTtJQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxhQUFhLENBQUM7QUFDdkQsQ0FBQztBQUVELG1DQUFtQyxJQUFJO0lBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGtCQUFrQixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEgsQ0FBQztBQUVELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFHLEVBQUU7SUFDNUIsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ1osTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6SyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsRUFBRSxDQUFDIn0=