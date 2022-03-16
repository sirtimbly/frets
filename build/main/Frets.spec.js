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
(0, ava_1.default)('FRETS initializes with simple types', t => {
    const app = (0, index_1.setup)(new SimpleProps(), (f) => {
        t.truthy(f.modelProps);
        t.truthy(f.modelProps.messages);
    });
    t.truthy(app.mountTo);
});
// Test("renders default div", (t) => {
// });
(0, ava_1.default)('actions change state', t => {
    const app = (0, index_1.setup)(new SimpleProps(), f => {
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
            return (0, maquette_1.h)('div', [
                (0, maquette_1.h)('button', { onclick: changeState }, ['Load Messages']),
                (0, maquette_1.h)('ul', fretsApp.modelProps.messages.map(x => (0, maquette_1.h)('li', [x.toString()])))
            ]);
        });
    });
    const proj = (0, maquette_query_1.createTestProjector)(app.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    const button = proj.query('button');
    t.truthy(button.exists);
    button.simulate.click();
    t.truthy(list.children.length);
    t.falsy(list.children[0].children);
    t.is(list.children[0].text, 'test');
});
(0, ava_1.default)('change state but validator stops mutation', t => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), f => {
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
            return (0, maquette_1.h)('div', [
                (0, maquette_1.h)('button#valid', { onclick: setOne }, ['Set to 1']),
                (0, maquette_1.h)('button#invalid', { onclick: setNegOne }, ['Set to -1']),
                (0, maquette_1.h)('ul', app.modelProps.messages.map(x => (0, maquette_1.h)('li', [x.toString()])))
            ]);
        });
    });
    const proj = (0, maquette_query_1.createTestProjector)(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    const button1 = proj.query('button#valid');
    const button2 = proj.query('button#invalid');
    button1.simulate.click();
    t.falsy(list.children.length);
    button2.simulate.click();
    t.is(list.children[0].text, 'Invalid');
});
(0, ava_1.default)('state updates async', t => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), f => {
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
            return (0, maquette_1.h)('div', [
                (0, maquette_1.h)('button', { onclick: timeoutdone }, ['Load Messages']),
                (0, maquette_1.h)('ul', app.modelProps.messages.map(x => (0, maquette_1.h)('li', [x.toString()])))
            ]);
        });
    });
    const proj = (0, maquette_query_1.createTestProjector)(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    proj.query('button').simulate.click();
    setTimeout(() => {
        const list2 = proj.query('ul');
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, 'async');
    }, 100);
});
(0, ava_1.default)('state updates async model', t => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal === null || proposal === void 0 ? void 0 : proposal.messages.length) {
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
            return (0, maquette_1.h)('div', [
                (0, maquette_1.h)('button', { onclick: timeoutdone }, ['Load Messages']),
                (0, maquette_1.h)('ul', app.modelProps.messages.map(x => (0, maquette_1.h)('li', [x.toString()])))
            ]);
        });
    });
    const proj = (0, maquette_query_1.createTestProjector)(mainApp.stateRenderer);
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
(0, ava_1.default)('registers a field', t => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), f => {
        const field = f.registerField('test', '0');
        t.is(f.modelProps.registeredFieldsValues.test, '0');
        t.is(field.value, '0');
    });
});
(0, ava_1.default)("registers and updates a field", (t) => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), (f) => {
        f.registerView((app) => {
            const field = f.registerField("test", "a");
            t.truthy(field.value);
            return (0, maquette_1.h)("div", [
                (0, maquette_1.h)("button", ["Load Messages"]),
                (0, maquette_1.h)("input", { type: "text", onchange: field.handler, value: field.value.toString() }),
                (0, maquette_1.h)("div.output", [field.value]),
            ]);
        });
    });
    const proj = (0, maquette_query_1.createTestProjector)(mainApp.stateRenderer);
    const input = proj.query("input");
    let inputElement; // not really useful in this particular application, but added just for demonstration purposes.
    proj.initialize(mainApp.stateRenderer);
    inputElement = { value: 'a' };
    input.setTargetDomNode(inputElement);
    t.truthy(input.exists);
    t.is(proj.query(".output").textContent, "a");
    inputElement = { value: 'ab' };
    input.simulate.change(inputElement);
    t.is(proj.query(".output").textContent, "ab");
});
(0, ava_1.default)("validates a field", (t) => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), (f) => {
        f.registerView((app) => {
            const field2 = f.registerField("test2", "", { notEmpty: { value: true, message: "missing" }, minLength: { value: 2, message: "short" }, maxLength: { value: 2, message: "long" } });
            return (0, maquette_1.h)("div", [
                (0, maquette_1.h)("input", { type: "text", onchange: field2.handler, value: field2.value.toString() }),
                (0, maquette_1.h)("div.message", [field2.validationErrors]),
                (0, maquette_1.h)("div.output", [field2.value]),
            ]);
        });
    });
    const proj = (0, maquette_query_1.createTestProjector)(mainApp.stateRenderer);
    const input = proj.query("input");
    let inputElement; // not really useful in this particular application, but added just for demonstration purposes.
    proj.initialize(mainApp.stateRenderer);
    inputElement = { value: '' };
    input.setTargetDomNode(inputElement);
    t.truthy(input.exists);
    t.is(proj.query(".output").textContent, "");
    inputElement = { value: 'b' };
    input.simulate.change(inputElement);
    t.is(proj.query(".output").textContent, "b");
    t.is(proj.query(".message").textContent, "short");
    inputElement = { value: 'bc' };
    input.simulate.change(inputElement);
    t.is(proj.query(".output").textContent, "bc");
    t.is(proj.query(".message").textContent, "");
    inputElement = { value: 'bcd' };
    input.simulate.change(inputElement);
    t.is(proj.query(".output").textContent, "bcd");
    t.is(proj.query(".message").textContent, "long");
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
(0, ava_1.default)('registers a route and changes when navigating', t => {
    const mainApp = (0, index_1.setup)(new SimpleProps(), f => {
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
            return (0, maquette_1.h)('div', [
                !app.modelProps.activeScreen ||
                    app.modelProps.activeScreen === SimpleScreens.Home
                    ? (0, maquette_1.h)('h1', ['Home Page'])
                    : (0, maquette_1.h)('h1', ['About Page'])
            ]);
        });
    });
    t.is(mainApp.fretsApp.getRouteLink('about'), '/about');
    t.false(mainApp.fretsApp.getRouteLink('xyz'));
    const proj = (0, maquette_query_1.createTestProjector)(mainApp.stateRenderer);
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
(0, ava_1.default)("state graph resolves", (t) => {
    const main = (0, index_1.setup)(new FormProps(), f => {
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
                    renderer: () => (0, maquette_1.h)("span", ["submitted the form"])
                },
                {
                    name: 'saved',
                    guard: (props) => Boolean(props.id),
                    renderer: () => (0, maquette_1.h)("span", ["saved form"]),
                    edges: [
                        {
                            name: 'submitting',
                            guard: (props) => props.actionInProgress === 'submit',
                            renderer: () => (0, maquette_1.h)("span", ["submitting"])
                        }
                    ]
                },
                {
                    name: 'empty',
                    guard: (props) => !props.id && props.actionInProgress !== 'load',
                    renderer: () => (0, maquette_1.h)("span", ["empty form screen"]),
                    edges: [
                        {
                            name: 'saving',
                            guard: (props) => (props.actionInProgress === 'save'),
                            renderer: () => (0, maquette_1.h)("span", ["saving"])
                        }
                    ]
                },
            ],
            renderer: () => (0, maquette_1.h)("span", ["opening screen"])
        });
        t.truthy(f.currentStateNode);
        const save = f.registerAction('save', (e, present) => {
            console.log('finished loading action');
            present({ actionInProgress: 'save' });
        });
        f.registerView((app) => (0, maquette_1.h)('div', [
            (0, maquette_1.h)('button#save', { onclick: save }, ['save']),
            app.currentStateNode.renderer(app)
        ]));
    });
    t.is(main.fretsApp.modelProps.actionInProgress, 'load');
    const proj = (0, maquette_query_1.createTestProjector)(main.stateRenderer);
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
//# sourceMappingURL=Frets.spec.js.map