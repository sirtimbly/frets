import { createProjector } from "maquette";
import Path from "path-parser";
export function setup(modelProps, setupFn, opts) {
    const projector = createProjector();
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
            spec: new Path(path),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvRnJldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFvQixlQUFlLEVBQXVCLE1BQU0sVUFBVSxDQUFDO0FBR2xGLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQztBQWlEL0IsTUFBTSxVQUFVLEtBQUssQ0FDbkIsVUFBYSxFQUFFLE9BQXlDLEVBQUUsSUFBb0I7SUFFOUUsTUFBTSxTQUFTLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFFcEMsTUFBTSxPQUFPLEdBRVQsRUFBRyxDQUFDO0lBRVIsTUFBTSxNQUFNLEdBS1IsRUFBRSxDQUFDO0lBRVAsTUFBTSxzQkFBc0IsR0FFeEIsRUFBRSxDQUFDO0lBRVAsSUFBSSxjQUEyQixDQUFDO0lBQ2hDLElBQUksS0FBeUIsQ0FBQztJQUM5QixNQUFNLENBQUMsR0FBaUI7UUFDdEIsVUFBVTtRQUNWLGNBQWM7UUFDZCxhQUFhO1FBQ2IsYUFBYTtRQUNiLG1CQUFtQjtRQUNuQixZQUFZO0tBQ2IsQ0FBQztJQUVGLFNBQVMsY0FBYyxDQUFDLEdBQVcsRUFBRSxRQUFzQjtRQUN6RCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDekI7UUFDRCxPQUFPLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDdEIsUUFBUSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsSUFBWSxFQUFFLFFBQXNCO1FBQzVFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRztZQUNaLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDckIsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FB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