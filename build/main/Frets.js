"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maquette_1 = require("maquette");
const path_parser_1 = require("path-parser");
function setup(modelProps, setupFn, opts) {
    const projector = maquette_1.createProjector();
    const actions = {};
    const routes = {};
    const registeredFieldActions = {};
    let modelPresenter;
    let state;
    const F = {
        modelProps,
        registerAction,
        registerField,
        registerModel,
        registerRouteAction,
        registerView,
    };
    function registerAction(key, actionFn) {
        if (!actions[key]) {
            actions[key] = actionFn;
        }
        return (event) => {
            actionFn(event, modelPresenter);
        };
    }
    function registerRouteAction(key, path, actionFn) {
        routes[key] = {
            calculator: actionFn,
            spec: new path_parser_1.default(path),
        };
    }
    function registerModel(presenterFn) {
        modelPresenter = (proposal) => {
            presenterFn(proposal, state);
        };
    }
    function registerView(renderFn) {
        stateRenderer = () => renderFn(F);
        state = (newProps) => {
            modelProps = newProps;
            projector.scheduleRender();
        };
    }
    function registerField(key, initialValue, validation) {
        function handler(evt) {
            const val = evt.target.value;
            modelProps.registeredFieldsValues[key] = val;
            if (validation) {
                let errors = [];
                if (validation.notEmpty === true && (!val || val === "")) {
                    errors = ["Should not be empty"];
                }
                modelProps.registeredFieldValidationErrors[key] = errors;
            }
        }
        if (modelProps.registeredFieldsValues[key] === undefined) {
            modelProps.registeredFieldsValues[key] = initialValue || "";
            modelProps.registeredFieldValidationErrors[key] = [];
        }
        if (registeredFieldActions[key] === undefined) {
            registeredFieldActions[key] = handler;
        }
        return {
            clear: () => {
                modelProps.registeredFieldsValues[key] = initialValue || "";
                modelProps.registeredFieldValidationErrors[key] = [];
            },
            handler,
            key,
            validationErrors: modelProps.registeredFieldValidationErrors[key],
            value: modelProps.registeredFieldsValues[key],
        };
    }
    let stateRenderer;
    setupFn(F);
    return {
        mountTo: (id) => {
            projector.merge(document.getElementById(id), stateRenderer);
        },
        stateRenderer,
    };
}
exports.setup = setup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBa0Y7QUFHbEYsNkNBQStCO0FBaUQvQixTQUFnQixLQUFLLENBQ25CLFVBQWEsRUFBRSxPQUF5QyxFQUFFLElBQW9CO0lBRTlFLE1BQU0sU0FBUyxHQUFHLDBCQUFlLEVBQUUsQ0FBQztJQUVwQyxNQUFNLE9BQU8sR0FFVCxFQUFHLENBQUM7SUFFUixNQUFNLE1BQU0sR0FLUixFQUFFLENBQUM7SUFFUCxNQUFNLHNCQUFzQixHQUV4QixFQUFFLENBQUM7SUFFUCxJQUFJLGNBQTJCLENBQUM7SUFDaEMsSUFBSSxLQUF5QixDQUFDO0lBQzlCLE1BQU0sQ0FBQyxHQUFpQjtRQUN0QixVQUFVO1FBQ1YsY0FBYztRQUNkLGFBQWE7UUFDYixhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLFlBQVk7S0FDYixDQUFDO0lBRUYsU0FBUyxjQUFjLENBQUMsR0FBVyxFQUFFLFFBQXNCO1FBQ3pELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQztTQUN6QjtRQUNELE9BQU8sQ0FBQyxLQUFZLEVBQUUsRUFBRTtZQUN0QixRQUFRLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxJQUFZLEVBQUUsUUFBc0I7UUFDNUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHO1lBQ1osVUFBVSxFQUFFLFFBQVE7WUFDcEIsSUFBSSxFQUFFLElBQUkscUJBQUksQ0FBQyxJQUFJLENBQUM7U0FDckIsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxXQUErQjtRQUNwRCxjQUFjLEdBQUcsQ0FBQyxRQUFvQixFQUFFLEVBQUU7WUFD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