"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const index_1 = require("./index");
const maquette_1 = require("maquette");
const maquette_query_1 = require("maquette-query");
var SimpleScreens;
(function (SimpleScreens) {
    SimpleScreens[SimpleScreens["Start"] = 0] = "Start";
    SimpleScreens[SimpleScreens["End"] = 1] = "End";
    SimpleScreens[SimpleScreens["Home"] = 2] = "Home";
    SimpleScreens[SimpleScreens["About"] = 3] = "About";
})(SimpleScreens || (SimpleScreens = {}));
class SimpleProps extends index_1.PropsWithFields {
    constructor() {
        super(...arguments);
        this.messages = [];
        this.checkValue = 0;
    }
}
ava_1.default('FRETS initializes with simple types', t => {
    const app = index_1.setup(new SimpleProps(), (f) => {
        t.truthy(f.modelProps);
        t.truthy(f.modelProps.messages);
    });
    t.truthy(app.mountTo);
});
// Test("renders default div", (t) => {
// });
ava_1.default('actions change state', t => {
    const app = index_1.setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.messages) {
                f.modelProps.messages = proposal.messages;
            }
            state(f.modelProps);
        });
        const changeState = f.registerAction('changeState', (e, present) => {
            present({ messages: ['test'] });
        });
        f.registerView((fretsApp) => {
            return maquette_1.h('div', [
                maquette_1.h('button', { onclick: changeState }, ['Load Messages']),
                maquette_1.h('ul', fretsApp.modelProps.messages.map(x => maquette_1.h('li', [x.toString()])))
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(app.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    const button = proj.query('button');
    t.truthy(button.exists);
    button.simulate.click();
    t.truthy(list.children.length);
    t.falsy(list.children[0].children);
    t.is(list.children[0].text, 'test');
});
ava_1.default('change state but validator stops mutation', t => {
    const mainApp = index_1.setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.checkValue < 0) {
                f.modelProps.messages = ['Invalid'];
            }
            state(f.modelProps);
        });
        const setOne = f.registerAction('setOne', (e, propose) => {
            propose({ checkValue: 1 });
        });
        const setNegOne = f.registerAction('setNegOne', (e, propose) => {
            propose({ checkValue: -1 });
        });
        f.registerView((app) => {
            return maquette_1.h('div', [
                maquette_1.h('button#valid', { onclick: setOne }, ['Set to 1']),
                maquette_1.h('button#invalid', { onclick: setNegOne }, ['Set to -1']),
                maquette_1.h('ul', app.modelProps.messages.map(x => maquette_1.h('li', [x.toString()])))
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    const button1 = proj.query('button#valid');
    const button2 = proj.query('button#invalid');
    button1.simulate.click();
    t.falsy(list.children.length);
    button2.simulate.click();
    t.is(list.children[0].text, 'Invalid');
});
ava_1.default('state updates async', t => {
    const mainApp = index_1.setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            state(f.modelProps);
        });
        const timeoutdone = f.registerAction('timeoutdone', (e, present) => {
            setTimeout(() => {
                present({
                    messages: ['async']
                });
            }, 50);
        });
        f.registerView((app) => {
            return maquette_1.h('div', [
                maquette_1.h('button', { onclick: timeoutdone }, ['Load Messages']),
                maquette_1.h('ul', app.modelProps.messages.map(x => maquette_1.h('li', [x.toString()])))
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    proj.query('button').simulate.click();
    setTimeout(() => {
        const list2 = proj.query('ul');
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, 'async');
    }, 100);
});
ava_1.default('state updates async model', t => {
    const mainApp = index_1.setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            var _a;
            if ((_a = proposal) === null || _a === void 0 ? void 0 : _a.messages.length) {
                f.modelProps.messages = proposal.messages;
                state(f.modelProps);
            }
            setTimeout(() => {
                f.modelProps.messages = ['done'];
                state(Object.assign({}, f.modelProps));
            }, 50);
        });
        const timeoutdone = f.registerAction('timeoutdone', (e, present) => {
            present({ messages: ['loading'] });
        });
        f.registerView((app) => {
            return maquette_1.h('div', [
                maquette_1.h('button', { onclick: timeoutdone }, ['Load Messages']),
                maquette_1.h('ul', app.modelProps.messages.map(x => maquette_1.h('li', [x.toString()])))
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    proj.query('button').simulate.click();
    t.truthy(list.children.length);
    t.is(list.children[0].text, 'loading');
    setTimeout(() => {
        const list2 = proj.query('ul');
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, 'done');
    }, 100);
});
ava_1.default('registers a field', t => {
    const mainApp = index_1.setup(new SimpleProps(), f => {
        const field = f.registerField('test', '0');
        t.is(f.modelProps.registeredFieldsValues.test, '0');
        t.is(field.value, '0');
    });
});
ava_1.default("registers and updates a field", (t) => {
    const mainApp = index_1.setup(new SimpleProps(), (f) => {
        f.registerView((app) => {
            const field = f.registerField("test", "a");
            t.truthy(field.value);
            return maquette_1.h("div", [
                maquette_1.h("button", ["Load Messages"]),
                maquette_1.h("input", { type: "text", oninput: field.handler, value: field.value.toString() }),
                maquette_1.h("div.output", [field.value]),
            ]);
        });
    });
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    const input = proj.query("input");
    let inputElement; // not really useful in this particular application, but added just for demonstration purposes.
    proj.initialize(mainApp.stateRenderer);
    inputElement = { value: 'a' };
    input.setTargetDomNode(inputElement);
    t.truthy(input.exists);
    t.is(proj.query(".output").textContent, "a");
    proj.query("input").simulate.keyPress("b", "", "ab");
    t.is(proj.query(".output").textContent, "ab");
});
// test("register view async", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   async function asyncViewFunction(app: main): Promise<VNode> {
//     return new Promise<VNode>((resolve, reject) => {
//       // simulate view rendering code being loaded async like from a webpack chunk
//       setTimeout(() => {
//         resolve(h("div", [
//           h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
//         ]));
//       }, 50);
//     });
//   }
//   F.registerViewAsync(asyncViewFunction);
//   const proj = createTestProjector(F.stateRenderer);
//   const list = proj.query("ul");
//   t.truthy(list.exists);
// });
ava_1.default('registers a route and changes when navigating', t => {
    const mainApp = index_1.setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.activeScreen) {
                f.modelProps.activeScreen = proposal.activeScreen;
                state(f.modelProps);
            }
        });
        f.registerRouteAction('home', '/home', (context, propose) => {
            propose({
                activeScreen: SimpleScreens.Home
            });
        });
        f.registerRouteAction('about', '/about', (context, propose) => {
            propose({
                activeScreen: SimpleScreens.About
            });
        });
        f.registerView((app) => {
            return maquette_1.h('div', [
                !app.modelProps.activeScreen ||
                    app.modelProps.activeScreen === SimpleScreens.Home
                    ? maquette_1.h('h1', ['Home Page'])
                    : maquette_1.h('h1', ['About Page'])
            ]);
        });
    });
    t.is(mainApp.fretsApp.getRouteLink('about'), '/about');
    t.false(mainApp.fretsApp.getRouteLink('xyz'));
    const proj = maquette_query_1.createTestProjector(mainApp.stateRenderer);
    t.is(proj.query('h1').textContent, 'Home Page');
    mainApp.fretsApp.navToPath('/about');
    window.dispatchEvent(new Event('popstate'));
    t.is(proj.query('h1').textContent, 'About Page');
    mainApp.fretsApp.navToRoute('home');
    window.dispatchEvent(new Event('popstate'));
    t.is(proj.query('h1').textContent, 'Home Page');
});
// Test("model props can only be updated through an action", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.registerView((app): VNode => {
//     // try overwriting something in modelProps
//     t.throws(() => app.modelProps.messages.push("try"));
//     return h("div", [
//       (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
//         ? h("h1", ["Home Page"])
//         : h("h1", ["About Page"]),
//       h("ul", app.modelProps.messages.map((x: string) => h("li", [x]))),
//     ]);
//   });
//   t.not(F.modelProps.messages[0], "try");
//   const proj = createTestProjector(F.stateRenderer);
//   const msgs = proj.query("ul>li");
//   t.falsy(msgs.exists());
//   t.not(F.modelProps.messages[0], "try");
// });
class FormProps extends index_1.PropsWithFields {
    constructor() {
        super(...arguments);
        this.status = 'draft';
        this.actionInProgress = 'load';
    }
}
ava_1.default("state graph resolves", (t) => {
    const main = index_1.setup(new FormProps(), f => {
        f.registerAcceptor((proposal, updateState) => {
            console.log('accepting', proposal);
            updateState(proposal);
        });
        f.registerStateGraph({
            name: 'opening',
            // edges are specified in reverse specificity order because edges are evaluated
            // in order and only the first node in an array of edges is returned
            edges: [
                {
                    name: 'submitted',
                    guard: (props) => props.status === 'submitted',
                    renderer: () => maquette_1.h("span", ["submitted the form"])
                },
                {
                    name: 'saved',
                    guard: (props) => Boolean(props.id),
                    renderer: () => maquette_1.h("span", ["saved form"]),
                    edges: [
                        {
                            name: 'submitting',
                            guard: (props) => props.actionInProgress === 'submit',
                            renderer: () => maquette_1.h("span", ["submitting"])
                        }
                    ]
                },
                {
                    name: 'empty',
                    guard: (props) => !props.id && props.actionInProgress !== 'load',
                    renderer: () => maquette_1.h("span", ["empty form screen"]),
                    edges: [
                        {
                            name: 'saving',
                            guard: (props) => (props.actionInProgress === 'save'),
                            renderer: () => maquette_1.h("span", ["saving"])
                        }
                    ]
                },
            ],
            renderer: () => maquette_1.h("span", ["opening screen"])
        });
        t.truthy(f.currentStateNode);
        const save = f.registerAction('save', (e, present) => {
            console.log('finished loading action');
            present({ actionInProgress: 'save' });
        });
        f.registerView((app) => maquette_1.h('div', [
            maquette_1.h('button#save', { onclick: save }, ['save']),
            app.currentStateNode.renderer(app)
        ]));
    });
    t.is(main.fretsApp.modelProps.actionInProgress, 'load');
    const proj = maquette_query_1.createTestProjector(main.stateRenderer);
    t.is(proj.query('span').textContent, 'opening screen');
    // t.is(main.fretsApp.resolveState().name, 'opening')
    main.present({ actionInProgress: undefined });
    t.is(proj.query('span').textContent, 'empty form screen');
    proj.query('button#save').simulate.click();
    t.is(proj.query('span').textContent, 'saving');
    main.present({ actionInProgress: undefined, id: '12321' });
    t.is(proj.query('span').textContent, 'saved form');
    main.present({ actionInProgress: 'submit' });
    t.is(proj.query('span').textContent, 'submitting');
    main.present({ actionInProgress: undefined, status: 'submitted' });
    t.is(proj.query('span').textContent, 'submitted the form');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmV0cy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQXVCO0FBQ3ZCLG1DQUlpQjtBQUNqQix1Q0FBa0M7QUFDbEMsbURBQXFEO0FBR3JELElBQUssYUFLSjtBQUxELFdBQUssYUFBYTtJQUNqQixtREFBSyxDQUFBO0lBQ0wsK0NBQUcsQ0FBQTtJQUNILGlEQUFJLENBQUE7SUFDSixtREFBSyxDQUFBO0FBQ04sQ0FBQyxFQUxJLGFBQWEsS0FBYixhQUFhLFFBS2pCO0FBRUQsTUFBTSxXQUFZLFNBQVEsdUJBQWU7SUFBekM7O1FBQ1EsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUd4QixlQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7Q0FBQTtBQUlELGFBQUksQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsRUFBRTtJQUMvQyxNQUFNLEdBQUcsR0FBRyxhQUFLLENBQWMsSUFBSSxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQU8sRUFBRSxFQUFFO1FBQzdELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNILENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0FBRUgsdUNBQXVDO0FBRXZDLE1BQU07QUFFTixhQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDaEMsTUFBTSxHQUFHLEdBQUcsYUFBSyxDQUFjLElBQUksV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDckQsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxF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