"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.message = 'Use `imports` property for the list of imported modules';
exports.deprecatedApiModules = {
    create(context) {
        return {
            ClassDeclaration: (node) => {
                const property = getModuleModulesProperty(node);
                if (property) {
                    context.report({ node: property, message: exports.message });
                }
            }
        };
    }
};
function getModuleModulesProperty(node) {
    const decorator = utils_1.getDecoratorByName(node, 'Module');
    if (!decorator) {
        return false;
    }
    const [argument] = decorator.expression.arguments;
    const result = (argument.type === 'ObjectExpression') && (argument.properties || []).find(property => {
        return property.key && property.key.type === 'Identifier' && property.key.name === 'modules';
    });
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwcmVjYXRlZC1hcGktbW9kdWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kZXByZWNhdGVkLWFwaS1tb2R1bGVzL2RlcHJlY2F0ZWQtYXBpLW1vZHVsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxvQ0FBOEM7QUFFakMsUUFBQSxPQUFPLEdBQUcseURBQXlELENBQUM7QUFDcEUsUUFBQSxvQkFBb0IsR0FBRztJQUNoQyxNQUFNLENBQUMsT0FBTztRQUNWLE1BQU0sQ0FBQztZQUNILGdCQUFnQixFQUFFLENBQUMsSUFBc0IsRUFBRSxFQUFFO2dCQUN6QyxNQUFNLFFBQVEsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDWCxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQVAsZUFBTyxFQUFFLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztZQUNMLENBQUM7U0FDSixDQUFDO0lBQ04sQ0FBQztDQUNKLENBQUM7QUFFRixrQ0FBa0MsSUFBUztJQUN2QyxNQUFNLFNBQVMsR0FBRywwQkFBa0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckQsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFJLFNBQVMsQ0FBQyxVQUE2QixDQUFDLFNBQVMsQ0FBQztJQUN0RSxNQUFNLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssa0JBQWtCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2pHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7SUFDakcsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2xCLENBQUMifQ==